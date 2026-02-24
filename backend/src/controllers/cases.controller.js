/**
 * Controlador de Casos - Gestiona operaciones CRUD de casos de cobranza
 * 
 * Responsabilidades:
 * - Crear nuevos casos con información del deudor
 * - Listar casos (filtrados por usuario si no es ADMIN)
 * - Obtener detalle de un caso
 * - Asignar casos a usuarios específidos
 * - Cambiar estado del caso (NUEVO, EN_GESTION, PROMESA_PAGO, etc)
 * - Actualizar datos del caso (monto, descripción)
 * - Actualizar datos del deudor
 * - Eliminar casos (soft delete)
 * 
 * Control de acceso:
 * - ADMIN: acceso a todos los casos
 * - Otros: solo sus casos asignados
 */

const {
  createCase,
  listCases,
  getCaseById,
  assignCase,
  updateCaseStatus,
  updateCase,
  updateDebtorByCase,
  softDeleteCase,
  ensureCaseAccess
} = require("../services/cases.service");

/**
 * POST /api/cases - Crea un nuevo caso de cobranza
 * Incluye información del deudor y datos iniciales del caso
 */
async function createCaseController(req, res) {
  try {
    const { deudor, caso } = req.body || {};
    if (!deudor?.nombres || !deudor?.apellidos) {
      return res.status(400).json({ ok: false, message: "Deudor nombres y apellidos requeridos" });
    }
    const r = await createCase({ deudor, caso: caso || {} });
    res.status(201).json({ ok: true, ...r });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// GET /api/cases - Lista casos de cobranza
async function listCasesController(req, res) {
  try {
    // Si el usuario no es ADMIN, filtrar solo los casos asignados a este usuario
    const isAdmin = (req.user?.roles || []).includes("ADMIN");
    const asignadoAUsuarioId = isAdmin ? null : req.user.usuarioId;

    const rows = await listCases({ asignadoAUsuarioId });
    res.json({ ok: true, cases: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// GET /api/cases/:id - Detalle de un caso de cobranza
async function getCaseController(req, res) {
  try {
    const casoId = Number(req.params.id);
    const c = await getCaseById(casoId);
    if (!c) return res.status(404).json({ ok: false, message: "Caso no encontrado" });

    // Control de acceso: ADMIN o dueño del caso
    const isAdmin = (req.user?.roles || []).includes("ADMIN");
    if (!isAdmin && Number(c.AsignadoAUsuarioId) !== Number(req.user.usuarioId)) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    res.json({ ok: true, case: c });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// POST /api/cases/:id/assign - Asignar caso a un usuario específico
async function assignCaseController(req, res) {
  try {
    const casoId = Number(req.params.id);
    const { usuarioId } = req.body || {};
    if (!usuarioId) return res.status(400).json({ ok: false, message: "usuarioId requerido" });

    await assignCase(casoId, usuarioId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// POST /api/cases/:id/status - Cambiar estado del caso (NUEVO, EN_GESTION, PROMESA_PAGO, etc)
async function updateCaseStatusController(req, res) {
  try {
    const casoId = Number(req.params.id);
    const { estadoCodigo } = req.body || {};

    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }
    if (!estadoCodigo) {
      return res.status(400).json({ ok: false, message: "estadoCodigo requerido" });
    }

    // ADMIN
    const allowed = await ensureCaseAccess(req.user, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    await updateCaseStatus(casoId, estadoCodigo);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// PUT /api/cases/:id - Actualizar datos del caso (monto, descripción, asignación)
async function updateCaseController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const { monto, descripcion, asignadoAUsuarioId } = req.body || {};

    await updateCase(casoId, { monto, descripcion, asignadoAUsuarioId });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// PUT /api/cases/:id/debtor - Actualizar datos del deudor (nombres, apellidos, documento, etc)
async function updateDebtorController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    await updateDebtorByCase(casoId, req.body || {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
// DELETE /api/cases/:id - Eliminar caso
async function deleteCaseController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    await softDeleteCase(casoId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

module.exports = {
  createCaseController,
  listCasesController,
  getCaseController,
  assignCaseController,
  updateCaseStatusController,
  updateCaseController,
  updateDebtorController,
  deleteCaseController
};
