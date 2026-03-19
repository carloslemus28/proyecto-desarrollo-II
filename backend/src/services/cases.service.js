const { pool } = require("../config/db");

async function createCase({ deudor, caso }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insDeudor] = await conn.execute(
      `INSERT INTO Deudores (
        Nombres, Apellidos, Documento,
        TelefonoPais, TelefonoPrefijo, TelefonoNumero,
        Email, Direccion, Lat, Lng
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deudor.nombres,
        deudor.apellidos,
        deudor.documento || null,
        deudor.telefonoPais || null,
        deudor.telefonoPrefijo || null,
        deudor.telefonoNumero || null,
        deudor.email || null,
        deudor.direccion || null,
        deudor.lat ?? null,
        deudor.lng ?? null,
      ]
    );
    const deudorId = insDeudor.insertId;

    const [estadoRows] = await conn.execute(
      `SELECT EstadoId FROM CatalogoEstados WHERE Codigo = ? AND Activo = 1`,
      [caso.estadoCodigo || "NUEVO"]
    );
    if (!estadoRows[0]) throw new Error("Estado inválido");

    const [maxRows] = await conn.execute(`SELECT IFNULL(MAX(CasoId),0) AS maxId FROM Casos`);
    const next = Number(maxRows[0].maxId) + 1;
    const codigoCaso = `CASO-${String(next).padStart(6, "0")}`;

    const monto = Number(caso.monto ?? 0);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error("Monto debe ser mayor que cero");
    }

    const [insCaso] = await conn.execute(
      `INSERT INTO Casos (CodigoCaso, DeudorId, EstadoId, Monto, Descripcion, AsignadoAUsuarioId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        codigoCaso,
        deudorId,
        estadoRows[0].EstadoId,
        monto,
        caso.descripcion || null,
        caso.asignadoAUsuarioId || null,
      ]
    );

    await conn.commit();
    return { casoId: insCaso.insertId, codigoCaso };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function listCases({ asignadoAUsuarioId } = {}) {
  let sql = `
    SELECT
      c.CasoId, c.CodigoCaso, c.Monto, c.Descripcion, c.FechaApertura, c.FechaCierre,
      ce.Codigo AS EstadoCodigo, ce.Nombre AS EstadoNombre,
      d.DeudorId, d.Nombres, d.Apellidos, d.Documento,
      d.TelefonoPais, d.TelefonoPrefijo, d.TelefonoNumero,
      d.Email, d.Direccion, d.Lat, d.Lng,
      c.AsignadoAUsuarioId
    FROM Casos c
    LEFT JOIN CatalogoEstados ce ON ce.EstadoId = c.EstadoId
    LEFT JOIN Deudores d ON d.DeudorId = c.DeudorId
  `;
  const params = [];

  sql += ` WHERE c.Activo = 1`;
  if (asignadoAUsuarioId) {
    sql += ` AND c.AsignadoAUsuarioId = ?`;
    params.push(asignadoAUsuarioId);
  }
  sql += ` ORDER BY c.CasoId DESC`;

  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (e) {
    console.error("Error en listCases SQL:", sql, "Params:", params, e);
    throw e;
  }
}

async function getCaseById(casoId) {
  const [rows] = await pool.execute(
    `
    SELECT
      c.CasoId, c.CodigoCaso, c.Monto, c.Descripcion, c.FechaApertura, c.FechaCierre,
      ce.Codigo AS EstadoCodigo, ce.Nombre AS EstadoNombre,
      d.DeudorId, d.Nombres, d.Apellidos, d.Documento,
      d.TelefonoPais, d.TelefonoPrefijo, d.TelefonoNumero,
      d.Email, d.Direccion, d.Lat, d.Lng,
      c.AsignadoAUsuarioId
    FROM Casos c
    LEFT JOIN CatalogoEstados ce ON ce.EstadoId = c.EstadoId
    LEFT JOIN Deudores d ON d.DeudorId = c.DeudorId
    WHERE c.CasoId = ? AND c.Activo = 1
    `,
    [casoId]
  );
  return rows[0] || null;
}

async function assignCase(casoId, usuarioId) {
  await pool.execute(
    `UPDATE Casos SET AsignadoAUsuarioId = ? WHERE CasoId = ?`,
    [usuarioId, casoId]
  );
}

async function updateCaseStatus(casoId, estadoCodigo) {
  const allowedEstados = ["NUEVO", "EN_GESTION", "PROMESA_PAGO", "INCUMPLIDO", "CERRADO"];
  if (!allowedEstados.includes(estadoCodigo)) throw new Error("Estado inválido");

  const [rows] = await pool.execute(
    `SELECT EstadoId FROM CatalogoEstados WHERE Codigo = ? AND Activo = 1`,
    [estadoCodigo]
  );
  if (!rows[0]) throw new Error("Estado inválido");

  if (estadoCodigo === "CERRADO") {
    await pool.execute(
      `UPDATE Casos SET EstadoId = ?, FechaCierre = NOW() WHERE CasoId = ?`,
      [rows[0].EstadoId, casoId]
    );
  } else {
    await pool.execute(
      `UPDATE Casos SET EstadoId = ?, FechaCierre = NULL WHERE CasoId = ?`,
      [rows[0].EstadoId, casoId]
    );
  }
}

async function updateCase(casoId, { monto, descripcion, asignadoAUsuarioId }) {
  const fields = [];
  const values = [];

  if (monto !== undefined) {
    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      throw new Error("Monto debe ser mayor que cero");
    }
    fields.push("Monto = ?");
    values.push(montoNum);
  }
  if (descripcion !== undefined) {
    fields.push("Descripcion = ?");
    values.push(descripcion);
  }
  if (asignadoAUsuarioId !== undefined) {
    fields.push("AsignadoAUsuarioId = ?");
    values.push(asignadoAUsuarioId || null);
  }

  if (fields.length === 0) return;

  values.push(casoId);
  await pool.execute(`UPDATE Casos SET ${fields.join(", ")} WHERE CasoId = ?`, values);
}

async function ensureCaseAccess(reqUser, casoId) {
  const isAdmin = (reqUser?.roles || []).includes("ADMIN");
  if (isAdmin) return true;

  const [rows] = await pool.execute(
    `SELECT AsignadoAUsuarioId FROM Casos WHERE CasoId = ?`,
    [casoId]
  );
  if (!rows[0]) return false;

  return Number(rows[0].AsignadoAUsuarioId) === Number(reqUser.usuarioId);
}

async function updateDebtorByCase(casoId, debtor) {
  const [rows] = await pool.execute(`SELECT DeudorId FROM Casos WHERE CasoId = ?`, [casoId]);
  if (!rows[0]) throw new Error("Caso no encontrado");

  const deudorId = rows[0].DeudorId;

  const fields = [];
  const values = [];

  const map = {
    nombres: "Nombres",
    apellidos: "Apellidos",
    documento: "Documento",
    telefonoPais: "TelefonoPais",
    telefonoPrefijo: "TelefonoPrefijo",
    telefonoNumero: "TelefonoNumero",
    email: "Email",
    direccion: "Direccion",
    lat: "Lat",
    lng: "Lng",
  };

  Object.keys(map).forEach((k) => {
    if (debtor[k] !== undefined) {
      fields.push(`${map[k]} = ?`);
      values.push(debtor[k] === "" ? null : debtor[k]);
    }
  });

  if (fields.length === 0) return;

  values.push(deudorId);
  await pool.execute(`UPDATE Deudores SET ${fields.join(", ")} WHERE DeudorId = ?`, values);
}

async function softDeleteCase(casoId) {
  const [r] = await pool.execute(
    `UPDATE Casos
     SET Activo = 0, FechaCierre = IFNULL(FechaCierre, NOW())
     WHERE CasoId = ?`,
    [casoId]
  );
  if (r.affectedRows === 0) throw new Error("Caso no encontrado");
}

module.exports = {
  createCase,
  listCases,
  getCaseById,
  assignCase,
  updateCaseStatus,
  updateCase,
  updateDebtorByCase,
  softDeleteCase,
  ensureCaseAccess
};