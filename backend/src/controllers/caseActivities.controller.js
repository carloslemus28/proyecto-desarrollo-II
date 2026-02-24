/**
 * Controlador de Actividades de Casos - Gestiona notas y seguimiento
 * 
 * Responsabilidades:
 * - Agregar actividades (notas y llamadas) a un caso
 * - Listar historial de actividades de un caso
 * - Actualizar actividades existentes (solo creador o ADMIN)
 * - Eliminar actividades (solo creador o ADMIN)
 * 
 * Control de acceso: ADMIN o usuario asignado al caso
 */

const { addActivity, listActivities, softDeleteActivity, updateActivity } = require("../services/caseActivities.service");
const { pool } = require("../config/db");

/**
 * Verifica si el usuario tiene acceso al caso
 * ADMIN: acceso a todos
 * AGENTE: solo si está asignado al caso
 */
async function ensureCaseAccess(req, casoId) {
  const isAdmin = (req.user?.roles || []).includes("ADMIN");
  if (isAdmin) return true;

  const [rows] = await pool.execute(
    `SELECT AsignadoAUsuarioId FROM Casos WHERE CasoId = ?`,
    [casoId]
  );
  if (!rows[0]) return false;

  return Number(rows[0].AsignadoAUsuarioId) === Number(req.user.usuarioId);
}

/**
 * POST /api/cases/:id/activities - Agrega una actividad al caso
 */
async function addActivityController(req, res) {
  try {
    const casoId = Number(req.params.id);
    const { tipo, nota } = req.body || {};

    if (!casoId || !tipo) {
      return res.status(400).json({ ok: false, message: "casoId y tipo son requeridos" });
    }

    const allowed = await ensureCaseAccess(req, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    const r = await addActivity({
      casoId,
      usuarioId: req.user.usuarioId,
      tipo,
      nota,
    });

    res.status(201).json({ ok: true, ...r });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

/**
 * GET /api/cases/:id/activities - Lista actividades del caso
 */
async function listActivitiesController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!casoId) return res.status(400).json({ ok: false, message: "ID inválido" });

    const allowed = await ensureCaseAccess(req, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    const rows = await listActivities(casoId);
    res.json({ ok: true, activities: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

/**
 * PUT /api/cases/activities/:id - Actualiza una actividad
 * Solo el creador o ADMIN pueden editar
 */
async function updateActivityController(req, res) {
  try {
    const actividadId = Number(req.params.id);
    const { nota, tipo } = req.body;
    const usuarioId = req.user.usuarioId;

    await updateActivity(actividadId, { nota, tipo }, usuarioId, req.user.roles);
    res.json({ ok: true });
  } catch (e) {
    res.status(403).json({ ok: false, message: e.message });
  }
}

/**
 * DELETE /api/cases/activities/:id - Elimina una actividad
 * Solo el creador o ADMIN pueden eliminar
 */
async function deleteActivityController(req, res) {
  try {
    const actividadId = Number(req.params.id);
    const usuarioId = req.user.usuarioId;

    await softDeleteActivity(actividadId, usuarioId, req.user.roles);
    res.json({ ok: true });
  } catch (e) {
    res.status(403).json({ ok: false, message: e.message });
  }
}

module.exports = { 
  addActivityController,
  listActivitiesController,
  updateActivityController,
  deleteActivityController
};
// Controlador de Actividades de Casos - Gestiona notas y seguimiento
async function addActivityController(req, res) {
  try {
    const casoId = Number(req.params.id);
    const { tipo, nota } = req.body || {};

    if (!casoId || !tipo) {
      return res.status(400).json({ ok: false, message: "casoId y tipo son requeridos" });
    }

    const allowed = await ensureCaseAccess(req, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    const r = await addActivity({
      casoId,
      usuarioId: req.user.usuarioId,
      tipo,
      nota,
    });

    res.status(201).json({ ok: true, ...r });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// Lista actividades del caso
async function listActivitiesController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!casoId) return res.status(400).json({ ok: false, message: "ID inválido" });

    const allowed = await ensureCaseAccess(req, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    const rows = await listActivities(casoId);
    res.json({ ok: true, activities: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// Actualiza una actividad - Solo el creador o ADMIN pueden editar
async function updateActivityController(req, res) {
  try {
    const actividadId = Number(req.params.id);
    const { nota, tipo } = req.body;
    const usuarioId = req.user.usuarioId;

    await updateActivity(actividadId, { nota, tipo }, usuarioId, req.user.roles);
    res.json({ ok: true });
  } catch (e) {
    res.status(403).json({ ok: false, message: e.message });
  }
}
// Elimina una actividad - Solo el creador o ADMIN pueden eliminar
async function deleteActivityController(req, res) {
  try {
    const actividadId = Number(req.params.id);
    const usuarioId = req.user.usuarioId;

    await softDeleteActivity(actividadId, usuarioId, req.user.roles);
    res.json({ ok: true });
  } catch (e) {
    res.status(403).json({ ok: false, message: e.message });
  }
}

module.exports = { 
  addActivityController,
  listActivitiesController,
  updateActivityController,
  deleteActivityController
};
