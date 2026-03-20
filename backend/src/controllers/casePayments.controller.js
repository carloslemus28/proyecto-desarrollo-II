const {
  listPaymentsByCase,
  addPaymentToCase,
  cancelPaymentInCase,
} = require("../services/casePayments.service");
const { ensureCaseAccess } = require("../services/cases.service");

async function listPaymentsController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const allowed = await ensureCaseAccess(req.user, casoId);
    if (!allowed) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    const rows = await listPaymentsByCase(casoId);
    return res.json({ ok: true, payments: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}

async function addPaymentController(req, res) {
  try {
    const casoId = Number(req.params.id);
    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const allowed = await ensureCaseAccess(req.user, casoId);
    if (!allowed) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    const { tipoPago, monto, observacion } = req.body || {};

    if (!tipoPago || monto === undefined || monto === null) {
      return res.status(400).json({
        ok: false,
        message: "tipoPago y monto son requeridos",
      });
    }

    const result = await addPaymentToCase({
      casoId,
      usuarioId: req.user.usuarioId,
      tipoPago,
      monto,
      observacion,
    });

    return res.status(201).json({ ok: true, ...result });
  } catch (e) {
    return res.status(400).json({ ok: false, message: e.message });
  }
}

async function cancelPaymentController(req, res) {
  try {
    const pagoId = Number(req.params.id);
    if (!Number.isInteger(pagoId) || pagoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const { motivo } = req.body || {};
    if (!motivo || !String(motivo).trim()) {
      return res.status(400).json({ ok: false, message: "El motivo es requerido" });
    }

    const result = await cancelPaymentInCase({
      pagoId,
      usuarioId: req.user.usuarioId,
      motivo,
    });

    return res.json({ ok: true, ...result });
  } catch (e) {
    return res.status(400).json({ ok: false, message: e.message });
  }
}

module.exports = {
  listPaymentsController,
  addPaymentController,
  cancelPaymentController,
};