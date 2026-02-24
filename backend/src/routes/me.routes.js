/**
 * Ruta de Perfil Actual del Usuario
 * 
 * Endpoint:
 * - GET /me: Retorna información del usuario autenticado actual
 * 
 * Datos retornados: usuarioId, nombre, email, roles, permisos
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");

router.get("/me", authRequired, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
