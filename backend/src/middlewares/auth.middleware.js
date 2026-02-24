/**
 * Middleware de autenticación - Verifica presencia y validez del token JWT
 * 
 * Responsabilidades:
 * - Extraer el token del header Authorization
 * - Validar formato Bearer Token
 * - Verificar y decodificar el JWT
 * - Inyectar datos del usuario en req.user
 * 
 * Retorna 401 si:
 * - Token no está presente
 * - Formato Bearer no es correcto
 * - Token es inválido o expirado
 */

const { verifyAccessToken } = require("../utils/jwt");
// funciones de usuarios para verificar roles/permisos
function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");

    // Validar que el header tenga formato "Bearer <token>"
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ ok: false, message: "Token requerido" });
    }

    // Decodificar y verificar el access token
    const decoded = verifyAccessToken(parts[1]);
    // decoded contiene: { usuarioId, nombre, email, roles, permisos }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }
}

module.exports = { authRequired };
