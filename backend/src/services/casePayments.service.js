const { pool } = require("../config/db");

async function listPaymentsByCase(casoId) {
  const [rows] = await pool.execute(
    `SELECT
        p.PagoId,
        p.CasoId,
        p.UsuarioId,
        p.TipoPago,
        p.Monto,
        p.Observacion,
        p.CreadoEn,
        p.Anulado,
        p.AnuladoPorUsuarioId,
        p.AnuladoEn,
        p.MotivoAnulacion,
        u.Nombre AS UsuarioNombre,
        ua.Nombre AS UsuarioAnulacionNombre
     FROM PagosCaso p
     JOIN Usuarios u ON u.UsuarioId = p.UsuarioId
     LEFT JOIN Usuarios ua ON ua.UsuarioId = p.AnuladoPorUsuarioId
     WHERE p.CasoId = ? AND p.Activo = 1
     ORDER BY p.PagoId DESC`,
    [casoId]
  );
  return rows;
}

async function addPaymentToCase({ casoId, usuarioId, tipoPago, monto, observacion }) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const amount = Number(monto);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("El monto debe ser mayor que 0");
    }

    const allowedTypes = ["ABONO", "PAGO_TOTAL"];
    if (!allowedTypes.includes(tipoPago)) {
      throw new Error("Tipo de pago inválido");
    }

    const [caseRows] = await conn.execute(
      `SELECT CasoId, Monto, EstadoId
       FROM Casos
       WHERE CasoId = ? AND Activo = 1
       LIMIT 1`,
      [casoId]
    );

    if (!caseRows[0]) throw new Error("Caso no encontrado");

    const saldoActual = Number(caseRows[0].Monto || 0);

    if (saldoActual <= 0) {
      throw new Error("El caso ya no tiene saldo pendiente");
    }

    if (amount > saldoActual) {
      throw new Error("El abono no puede ser mayor al saldo actual");
    }

    if (tipoPago === "PAGO_TOTAL" && amount !== saldoActual) {
      throw new Error("Para pago total, el monto debe ser igual al saldo actual");
    }

    const [ins] = await conn.execute(
      `INSERT INTO PagosCaso (CasoId, UsuarioId, TipoPago, Monto, Observacion)
       VALUES (?, ?, ?, ?, ?)`,
      [casoId, usuarioId, tipoPago, amount, observacion || null]
    );

    const nuevoSaldo = Number((saldoActual - amount).toFixed(2));

    let estadoCerradoId = null;
    if (nuevoSaldo === 0) {
      const [estadoRows] = await conn.execute(
        `SELECT EstadoId
         FROM CatalogoEstados
         WHERE Codigo = 'CERRADO' AND Activo = 1
         LIMIT 1`
      );
      estadoCerradoId = estadoRows?.[0]?.EstadoId || null;
    }

    if (nuevoSaldo === 0 && estadoCerradoId) {
      await conn.execute(
        `UPDATE Casos
         SET Monto = ?, EstadoId = ?, FechaCierre = NOW()
         WHERE CasoId = ?`,
        [nuevoSaldo, estadoCerradoId, casoId]
      );
    } else {
      await conn.execute(
        `UPDATE Casos
         SET Monto = ?
         WHERE CasoId = ?`,
        [nuevoSaldo, casoId]
      );
    }

    await conn.commit();

    return {
      pagoId: ins.insertId,
      saldoAnterior: saldoActual,
      saldoActual: nuevoSaldo,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function cancelPaymentInCase({ pagoId, usuarioId, motivo }) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    if (!motivo || !String(motivo).trim()) {
      throw new Error("El motivo de anulación es requerido");
    }

    const [paymentRows] = await conn.execute(
      `SELECT PagoId, CasoId, TipoPago, Monto, Anulado
       FROM PagosCaso
       WHERE PagoId = ? AND Activo = 1
       LIMIT 1`,
      [pagoId]
    );

    const pago = paymentRows[0];
    if (!pago) throw new Error("Pago no encontrado");
    if (Number(pago.Anulado) === 1) throw new Error("Este pago ya fue anulado");

    const [caseRows] = await conn.execute(
      `SELECT CasoId, Monto
       FROM Casos
       WHERE CasoId = ? AND Activo = 1
       LIMIT 1`,
      [pago.CasoId]
    );

    const caso = caseRows[0];
    if (!caso) throw new Error("Caso no encontrado");

    const saldoActual = Number(caso.Monto || 0);
    const montoPago = Number(pago.Monto || 0);
    const nuevoSaldo = Number((saldoActual + montoPago).toFixed(2));

    await conn.execute(
      `UPDATE PagosCaso
       SET Anulado = 1,
           AnuladoPorUsuarioId = ?,
           AnuladoEn = NOW(),
           MotivoAnulacion = ?
       WHERE PagoId = ?`,
      [usuarioId, String(motivo).trim(), pagoId]
    );

    const [estadoGestionRows] = await conn.execute(
      `SELECT EstadoId
       FROM CatalogoEstados
       WHERE Codigo = 'EN_GESTION' AND Activo = 1
       LIMIT 1`
    );
    const estadoGestionId = estadoGestionRows?.[0]?.EstadoId || null;

    if (nuevoSaldo > 0 && estadoGestionId) {
      await conn.execute(
        `UPDATE Casos
         SET Monto = ?, EstadoId = ?, FechaCierre = NULL
         WHERE CasoId = ?`,
        [nuevoSaldo, estadoGestionId, pago.CasoId]
      );
    } else {
      await conn.execute(
        `UPDATE Casos
         SET Monto = ?
         WHERE CasoId = ?`,
        [nuevoSaldo, pago.CasoId]
      );
    }

    await conn.commit();

    return {
      pagoId,
      casoId: pago.CasoId,
      saldoActual: nuevoSaldo,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listPaymentsByCase,
  addPaymentToCase,
  cancelPaymentInCase,
};