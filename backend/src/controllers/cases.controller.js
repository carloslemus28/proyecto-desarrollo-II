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

async function listCasesController(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: "Usuario no autenticado" });
    }

    const isAdmin = (req.user?.roles || []).includes("ADMIN");
    const asignadoAUsuarioId = isAdmin ? null : req.user.usuarioId;

    if (!isAdmin && !asignadoAUsuarioId) {
      return res.status(400).json({ ok: false, message: "usuarioId faltante" });
    }

    const rows = await listCases({ asignadoAUsuarioId });
    res.json({ ok: true, cases: rows });
  } catch (e) {
    console.error("Error en listCasesController:", e);
    res.status(500).json({ ok: false, message: e.message });
  }
}

async function getCaseController(req, res) {
  try {
    const casoId = Number(req.params.id);
    const c = await getCaseById(casoId);
    if (!c) return res.status(404).json({ ok: false, message: "Caso no encontrado" });

    const isAdmin = (req.user?.roles || []).includes("ADMIN");
    if (!isAdmin && Number(c.AsignadoAUsuarioId) !== Number(req.user.usuarioId)) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    res.json({ ok: true, case: c });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

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

    const allowed = await ensureCaseAccess(req.user, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    await updateCaseStatus(casoId, estadoCodigo);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

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

async function updateDebtorController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const allowed = await ensureCaseAccess(req.user, casoId);
    if (!allowed) return res.status(403).json({ ok: false, message: "No autorizado" });

    await updateDebtorByCase(casoId, req.body || {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

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