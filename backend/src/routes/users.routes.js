/**
 * Rutas de Gestión de Usuarios
 * 
 * Endpoints:
 * - GET /users: Lista usuarios (ADMIN)
 * - POST /users: Crea usuario (ADMIN)
 * - PUT /users/:id: Actualiza usuario (ADMIN)
 * - PUT /users/:id/password: Resetea contraseña (ADMIN)
 * 
 * Middleware requerido: authRequired + requirePermission("USERS_MANAGE")
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const {
  listUsersController,
  createUserController,
  updateUserController,
  resetPasswordController,
} = require("../controllers/users.controller");

router.get("/users", authRequired, requirePermission("USERS_MANAGE"), listUsersController);
router.post("/users", authRequired, requirePermission("USERS_MANAGE"), createUserController);
router.put("/users/:id", authRequired, requirePermission("USERS_MANAGE"), updateUserController);
router.put("/users/:id/password", authRequired, requirePermission("USERS_MANAGE"), resetPasswordController);

module.exports = router;
