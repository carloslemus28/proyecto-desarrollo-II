/**
 * Rutas de Actividades de Casos
 * 
 * Endpoints:
 * - GET /cases/:id/activities: Lista actividades del caso
 * - POST /cases/:id/activities: Agrega actividad (nota, llamada, etc.)
 * - PUT /cases/activities/:id: Actualiza actividad
 * - DELETE /cases/activities/:id: Elimina actividad
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const {
  addActivityController,
  listActivitiesController,
  updateActivityController,
  deleteActivityController
} = require("../controllers/caseActivities.controller");

router.get(
  "/cases/:id/activities",
  authRequired,
  requirePermission("CASES_READ"),
  listActivitiesController
);

router.post(
  "/cases/:id/activities",
  authRequired,
  requirePermission("CASES_MANAGE"),
  addActivityController
);

router.put(
  "/activities/:id",
  authRequired,
  requirePermission("CASES_MANAGE"),
  updateActivityController
);

router.delete(
  "/activities/:id",
  authRequired,
  requirePermission("CASES_MANAGE"),
  deleteActivityController
);


module.exports = router;
