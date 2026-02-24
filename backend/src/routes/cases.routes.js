/**
 * Rutas de Gestión de Casos
 * 
 * Endpoints principales:
 * - GET /cases: Lista casos (filtrado por usuario si no es ADMIN)
 * - POST /cases: Crea caso (ADMIN)
 * - GET /cases/:id: Obtiene detalle de caso
 * - PUT /cases/:id: Actualiza caso
 * - PUT /cases/:id/status: Cambia estado del caso
 * - PUT /cases/:id/assign: Asigna caso a usuario (ADMIN)
 * - PUT /cases/:id/debtor: Actualiza datos del deudor
 * - DELETE /cases/:id: Elimina caso
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const {
  createCaseController,
  listCasesController,
  getCaseController,
  assignCaseController,
  updateCaseStatusController, 
  updateCaseController,
  updateDebtorController,
  deleteCaseController
} = require("../controllers/cases.controller");

router.post("/cases", authRequired, requirePermission("CASES_MANAGE"), createCaseController);

router.get("/cases", authRequired, requirePermission("CASES_READ"), listCasesController);

router.get("/cases/:id", authRequired, requirePermission("CASES_READ"), getCaseController);

router.put("/cases/:id/assign", authRequired, requirePermission("CASES_MANAGE"), assignCaseController);

router.put("/cases/:id/status", authRequired, requirePermission("CASES_MANAGE"), updateCaseStatusController);

router.put("/cases/:id", authRequired, requirePermission("CASES_MANAGE"), updateCaseController);

router.put("/cases/:id/debtor", authRequired, requirePermission("CASES_MANAGE"), updateDebtorController);

router.delete("/cases/:id", authRequired, requirePermission("CASES_MANAGE"), deleteCaseController);

module.exports = router;
