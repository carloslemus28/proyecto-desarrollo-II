/**
 * Servicio de Actividades de Casos - Gestiona notas y seguimiento
 * 
 * Responsabilidades:
 * - Agregar actividades (notas, llamadas) a un caso
 * - Listar historial de actividades
 * - Actualizar actividades (solo creador o ADMIN)
 * - Eliminar actividades (soft delete, solo creador o ADMIN)
 * 
 * Tipos de actividad:
 * - NOTA: anotación de seguimiento
 * - LLAMADA: registro de llamada telefónica
 * - VISITA: registro de visita personal
 */

const { pool } = require("../config/db");

async function addActivity({ casoId, usuarioId, tipo, nota }) {
  const [r] = await pool.execute(
    `INSERT INTO ActividadesCaso (CasoId, UsuarioId, Tipo, Nota)
     VALUES (?, ?, ?, ?)`,
    [casoId, usuarioId, tipo, nota || null]
  );
  return { actividadId: r.insertId };
}

async function listActivities(casoId) {
  const [rows] = await pool.execute(
    `SELECT a.ActividadId, a.CasoId, a.UsuarioId, a.Tipo, a.Nota, a.CreadoEn,
            u.Nombre AS UsuarioNombre, u.Email AS UsuarioEmail
     FROM ActividadesCaso a
     LEFT JOIN Usuarios u ON u.UsuarioId = a.UsuarioId
     WHERE a.CasoId = ? AND a.Activo = 1
     ORDER BY a.ActividadId DESC`,
    [casoId]
  );
  return rows;
}

async function updateActivity(id, data, usuarioId, roles = []) {
  const [rows] = await pool.execute(
    `SELECT UsuarioId FROM ActividadesCaso WHERE ActividadId = ? AND Activo = 1`,
    [id]
  );
  if (!rows[0]) throw new Error("Actividad no encontrada");

  const ownerId = Number(rows[0].UsuarioId);
  const me = Number(usuarioId);
  const isAdmin = roles.includes("ADMIN");

  if (ownerId !== me && !isAdmin) {
    throw new Error("No tienes permiso para editar esta actividad");
  }

  let notaToSave = data.nota;
  if (typeof notaToSave === "string") {
    notaToSave = notaToSave.trim();

    notaToSave = notaToSave.replace(/\s*\(editado:\s*[^)]+\)$/i, "");

    const editadoEn = new Date().toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    notaToSave = `${notaToSave} (editado: ${editadoEn})`;
  }

  await pool.execute(
    `UPDATE ActividadesCaso SET Nota = ?, Tipo = ? WHERE ActividadId = ?`,
    [notaToSave, data.tipo, id]
  );
}

async function softDeleteActivity(id, usuarioId, roles = []) {
  const [rows] = await pool.execute(
    `SELECT UsuarioId FROM ActividadesCaso WHERE ActividadId = ? AND Activo = 1`,
    [id]
  );
  if (!rows[0]) throw new Error("Actividad no encontrada");

  const ownerId = Number(rows[0].UsuarioId);
  const me = Number(usuarioId);
  const isAdmin = roles.includes("ADMIN");

  if (ownerId !== me && !isAdmin) {
    throw new Error("No tienes permiso para eliminar esta actividad");
  }

  await pool.execute(
    `UPDATE ActividadesCaso SET Activo = 0 WHERE ActividadId = ?`,
    [id]
  );
}


module.exports = {
  addActivity,
  listActivities,
  updateActivity,
  softDeleteActivity
};
