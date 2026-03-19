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
        u.Nombre AS UsuarioNombre
     FROM PagosCaso p
     JOIN Usuarios u ON u.UsuarioId = p.UsuarioId
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

module.exports = {
  listPaymentsByCase,
  addPaymentToCase,
};