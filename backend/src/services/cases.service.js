/**
 * Servicio de Casos - Lógica de negocio para gestión de casos de cobranza
 * 
 * Responsabilidades:
 * - Crear nuevos casos con deudor asociado
 * - Listar y filtrar casos por usuario
 * - Obtener detalles de caso
 * - Asignar casos a usuarios
 * - Cambiar estado de caso
 * - Actualizar información del caso y deudor
 * - Eliminar casos 
 * - Validar permisos de acceso
 * 
 * Nota: Usa soft delete (marca como eliminado sin borrar datos)
 */

const { pool } = require("../config/db");

// Crear deudor si no existe y crear caso
async function createCase({ deudor, caso }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insert Deudor
    const [insDeudor] = await conn.execute(
      `INSERT INTO Deudores (Nombres, Apellidos, Documento, Telefono, Email, Direccion, Lat, Lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deudor.nombres,
        deudor.apellidos,
        deudor.documento || null,
        deudor.telefono || null,
        deudor.email || null,
        deudor.direccion || null,
        deudor.lat ?? null,
        deudor.lng ?? null,
      ]
    );
    const deudorId = insDeudor.insertId;

    // 2) Obtener EstadoId por código
    const [estadoRows] = await conn.execute(
      `SELECT EstadoId FROM CatalogoEstados WHERE Codigo = ? AND Activo = 1`,
      [caso.estadoCodigo || "NUEVO"]
    );
    if (!estadoRows[0]) throw new Error("Estado inválido");

    // 3) Generar CodigoCaso simple (CASO-000001)
    const [maxRows] = await conn.execute(`SELECT IFNULL(MAX(CasoId),0) AS maxId FROM Casos`);
    const next = Number(maxRows[0].maxId) + 1;
    const codigoCaso = `CASO-${String(next).padStart(6, "0")}`;

    // 4) Insert Caso
    const [insCaso] = await conn.execute(
      `INSERT INTO Casos (CodigoCaso, DeudorId, EstadoId, Monto, Descripcion, AsignadoAUsuarioId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        codigoCaso,
        deudorId,
        estadoRows[0].EstadoId,
        caso.monto || 0,
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
      d.DeudorId, d.Nombres, d.Apellidos, d.Documento, d.Telefono, d.Email, d.Direccion, d.Lat, d.Lng,
      c.AsignadoAUsuarioId
    FROM Casos c
    JOIN CatalogoEstados ce ON ce.EstadoId = c.EstadoId
    JOIN Deudores d ON d.DeudorId = c.DeudorId
  `;
  const params = [];

  sql += ` WHERE c.Activo = 1`;
  if (asignadoAUsuarioId) {
    sql += ` AND c.AsignadoAUsuarioId = ?`;
    params.push(asignadoAUsuarioId);
  }
  sql += ` ORDER BY c.CasoId DESC`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getCaseById(casoId) {
  const [rows] = await pool.execute(
    `
    SELECT
      c.CasoId, c.CodigoCaso, c.Monto, c.Descripcion, c.FechaApertura, c.FechaCierre,
      ce.Codigo AS EstadoCodigo, ce.Nombre AS EstadoNombre,
      d.DeudorId, d.Nombres, d.Apellidos, d.Documento, d.Telefono, d.Email, d.Direccion, d.Lat, d.Lng,
      c.AsignadoAUsuarioId
    FROM Casos c
    JOIN CatalogoEstados ce ON ce.EstadoId = c.EstadoId
    JOIN Deudores d ON d.DeudorId = c.DeudorId
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
  const [rows] = await pool.execute(
    `SELECT EstadoId FROM CatalogoEstados WHERE Codigo = ? AND Activo = 1`,
    [estadoCodigo]
  );
  if (!rows[0]) throw new Error("Estado inválido");

  await pool.execute(
    `UPDATE Casos SET EstadoId = ? WHERE CasoId = ?`,
    [rows[0].EstadoId, casoId]
  );
}

async function updateCase(casoId, { monto, descripcion, asignadoAUsuarioId }) {
  const fields = [];
  const values = [];

  if (monto !== undefined) { fields.push("Monto = ?"); values.push(monto); }
  if (descripcion !== undefined) { fields.push("Descripcion = ?"); values.push(descripcion); }
  if (asignadoAUsuarioId !== undefined) { fields.push("AsignadoAUsuarioId = ?"); values.push(asignadoAUsuarioId || null); }

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
    telefono: "Telefono",
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

async function updateCaseStatus(casoId, estadoCodigo) {
  // ✅ valida estados usados en tu UI
const allowedEstados = ["NUEVO", "EN_GESTION", "PROMESA_PAGO", "INCUMPLIDO", "CERRADO"];
  if (!allowedEstados.includes(estadoCodigo)) throw new Error("Estado inválido");

  const [rows] = await pool.execute(
    `SELECT EstadoId FROM CatalogoEstados WHERE Codigo = ? AND Activo = 1`,
    [estadoCodigo]
  );
  if (!rows[0]) throw new Error("Estado inválido");

  // ✅ si CERRADO, set FechaCierre, si no, limpia
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
