/**
 * Enrutador Principal de la API
 * 
 * Centraliza todas las rutas API disponibles:
 * - /auth: autenticación y gestión de sesiones
 * - /users: CRUD de usuarios (solo ADMIN)
 * - /cases: gestión completa de casos de cobranza
 * - /cases/:id/activities: historial y seguimiento de casos
 * - /cases/:id/files: gestión de archivos adjuntos
 * - /reports: reportes y análisis en JSON/CSV/PDF
 * - /wa: integración WhatsApp
 */

const router = require("express").Router();

// Endpoint de bienvenida
router.get("/", (req, res) => {
  res.json({ message: "API Cobranza - Bienvenido" });
});

// Rutas de autenticación
const authRoutes = require("./auth.routes");
router.use(authRoutes);

// Rutas de perfil actual
const meRoutes = require("./me.routes");
router.use(meRoutes);

// Rutas de gestión de usuarios
const usersRoutes = require("./users.routes");
router.use(usersRoutes);

// Rutas de casos
const casesRoutes = require("./cases.routes");
router.use(casesRoutes);

// Rutas de actividades de casos
const caseActivitiesRoutes = require("./caseActivities.routes");
router.use(caseActivitiesRoutes);

// Rutas de integración WhatsApp
const whatsappRoutes = require("./whatsapp.routes");
router.use(whatsappRoutes);

// Rutas de gestión de archivos
const filesRoutes = require("./files.routes");
router.use(filesRoutes);

// Rutas de reportes
const reportsRoutes = require("./reports.routes");
router.use(reportsRoutes);

module.exports = router;
