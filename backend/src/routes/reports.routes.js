/**
 * Rutas de Reportes
 * 
 * Endpoints:
 * - GET /reports/cases: Reporte JSON con estadísticas
 * - GET /reports/cases/csv: Descarga reporte en CSV
 * - GET /reports/cases/pdf: Descarga reporte en PDF
 * 
 * Filtros query: estado, agenteId, from, to
 * Acceso: Solo ADMIN con permiso REPORTS_READ
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const {
  reportCasesController,
  reportCasesCsvController,
  reportCasesPdfController,
} = require("../controllers/reports.controller");

// Permiso solo para ADMIN
function requireAdmin(req, res, next) {
  const roles = req.user?.roles || [];
  if (!roles.includes("ADMIN")) {
    return res.status(403).json({ ok: false, message: "Solo ADMIN puede ver reportes." });
  }
  next();
}

// List + KPI
router.get(
  "/reports/cases",
  authRequired,
  requirePermission("REPORTS_VIEW"),
  requireAdmin,
  reportCasesController
);

// Export CSV
router.get(
  "/reports/cases.csv",
  authRequired,
  requirePermission("REPORTS_VIEW"),
  requireAdmin,
  reportCasesCsvController
);

// Export PDF
router.get(
  "/reports/cases.pdf",
  authRequired,
  requirePermission("REPORTS_VIEW"),
  requireAdmin,
  reportCasesPdfController
);

module.exports = router;
