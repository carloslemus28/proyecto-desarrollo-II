/**
 * Rutas de Autenticación
 * 
 * Endpoints:
 * - POST /auth/login: Autentica usuario con email y contraseña
 * - POST /auth/refresh: Genera nuevo access token usando refresh token
 * - POST /auth/logout: Cierra sesión y revoca refresh token
 */

const router = require("express").Router();
const { loginController, refreshController, logoutController } = require("../controllers/auth.controller");

router.post("/auth/login", loginController);
router.get("/auth/refresh", refreshController);
router.post("/auth/logout", logoutController);

module.exports = router;
