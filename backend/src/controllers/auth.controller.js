/**
 * Controlador de autenticación - Gestiona login, refresh de tokens y logout
 * 
 * Responsabilidades:
 * - Autenticar usuarios con email y contraseña
 * - Generar y gestionar tokens de acceso y refresco
 * - Implementar rotación de refresh tokens por seguridad
 * - Revocar sesiones al hacer logout
 * 
 * Flujo de autenticación:
 * 1. Login: valida credenciales → genera access + refresh tokens
 * 2. Refresh: valida refresh token → genera nuevo access + refresh
 * 3. Logout: revoca refresh token y limpia cookies
 */

const { login } = require("../services/auth.service");
const { pool } = require("../config/db");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const {
  saveRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
} = require("../services/refreshTokens.service");

/**
 * Construye el payload completo del usuario para el access token
 * Incluye información base, roles y permisos
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Object|null>} Objeto con datos del usuario o null si no existe/inactivo
 */
async function buildUserPayload(usuarioId) {
  // Obtener datos base del usuario
  const [uRows] = await pool.execute(
    `SELECT UsuarioId, Nombre, Email, Activo
     FROM Usuarios WHERE UsuarioId = ? LIMIT 1`,
    [usuarioId]
  );
  const u = uRows[0];
  // Validar que el usuario existe y está activo
  if (!u || Number(u.Activo) !== 1) return null;

  // Obtener roles del usuario
  const [rolesRows] = await pool.execute(
    `SELECT r.Nombre
     FROM UsuariosRoles ur
     JOIN Roles r ON r.RolId = ur.RolId
     WHERE ur.UsuarioId = ?`,
    [usuarioId]
  );
  const roles = rolesRows.map((r) => r.Nombre);

  // Obtener permisos del usuario a través de sus roles
  const [permRows] = await pool.execute(
    `SELECT DISTINCT p.Codigo
     FROM UsuariosRoles ur
     JOIN RolesPermisos rp ON rp.RolId = ur.RolId
     JOIN Permisos p ON p.PermisoId = rp.PermisoId
     WHERE ur.UsuarioId = ? AND p.Activo = 1`,
    [usuarioId]
  );
  const permisos = permRows.map((p) => p.Codigo);

  return {
    usuarioId: u.UsuarioId,
    nombre: u.Nombre,
    email: u.Email,
    roles,
    permisos,
  };
}

/**
 * Configura la cookie de refresh token
 * Cookie httpOnly no accesible desde JavaScript (previene XSS)
 * @param {Object} res - Objeto response de Express
 * @param {string} refreshToken - Token a almacenar en la cookie
 */
function setRefreshCookie(res, refreshToken) {
  // En producción: secure:true si HTTPS
  res.cookie("rt", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
}

/**
 * Elimina la cookie de refresh token al logout
 * @param {Object} res - Objeto response de Express
 */
function clearRefreshCookie(res) {
  res.clearCookie("rt", { path: "/api/auth" });
}

/**
 * POST /api/auth/login - Autentica un usuario
 * Valida credenciales y genera tokens de acceso y refresco
 * @param {Object} req - Request con { email, password }
 * @param {Object} res - Response
 */
async function loginController(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email y password son requeridos" });
    }

    // Validar credenciales contra la base de datos
    const data = await login(email, password);
    if (!data) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    // Generar access token con todos los datos del usuario (corta duración)
    const accessToken = signAccessToken({
      usuarioId: data.usuarioId,
      nombre: data.nombre,
      email: data.email,
      roles: data.roles,
      permisos: data.permisos,
    });

    // Generar refresh token mínimo (solo ID, más seguro)
    const refreshToken = signRefreshToken({
      usuarioId: data.usuarioId,
      tokenType: "refresh",
    });

    // Guardar refresh token en BD para poder revocarlo después
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(data.usuarioId, refreshToken, expiresAt);

    // Almacenar refresh token en cookie httpOnly (protegido)
    setRefreshCookie(res, refreshToken);

    return res.json({ ok: true, token: accessToken, user: data });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
}

/**
 * POST /api/auth/refresh - Genera nuevo access token usando refresh token
 * Implementa rotación de refresh tokens (revoca el viejo, genera uno nuevo)
 * @param {Object} req - Request con refresh token en cookie
 * @param {Object} res - Response
 */
async function refreshController(req, res) {
  try {
    // Obtener refresh token de la cookie
    const refreshToken = req.cookies?.rt;
    if (!refreshToken) {
      return res.status(401).json({ ok: false, code: "NO_REFRESH", message: "Refresh requerido" });
    }

    // Verificar que el refresh token sea válido y no expirado
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.tokenType !== "refresh") {
      return res.status(401).json({ ok: false, code: "BAD_REFRESH", message: "Refresh inválido" });
    }

    const usuarioId = decoded.usuarioId;

    // Validar contra BD que no haya sido revocado y aún sea válido
    const valid = await findValidRefreshToken(usuarioId, refreshToken);
    if (!valid) {
      return res.status(401).json({ ok: false, code: "REFRESH_REVOKED", message: "Refresh revocado/expirado" });
    }

    // ROTACIÓN DE TOKENS: Revoca el refresh anterior
    await revokeRefreshToken(usuarioId, refreshToken);

    // Generar nuevo refresh token
    const newRefreshToken = signRefreshToken({ usuarioId, tokenType: "refresh" });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(usuarioId, newRefreshToken, expiresAt);
    setRefreshCookie(res, newRefreshToken);

    // Reconstruir datos completos del usuario
    const userPayload = await buildUserPayload(usuarioId);
    if (!userPayload) {
      clearRefreshCookie(res);
      return res.status(401).json({ ok: false, message: "Usuario inválido" });
    }

    // Generar nuevo access token
    const accessToken = signAccessToken(userPayload);

    return res.json({ ok: true, token: accessToken, user: userPayload });
  } catch (e) {
    console.error("REFRESH ERROR:", e?.message);
    return res.status(401).json({ ok: false, message: "No se pudo refrescar sesión" });
  }
}

/**
 * POST /api/auth/logout - Cierra sesión del usuario
 * Revoca el refresh token en BD y limpia la cookie
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
async function logoutController(req, res) {
  try {
    // Obtener refresh token de la cookie para revocarlo
    const refreshToken = req.cookies?.rt;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded?.usuarioId) {
          // Revocar el refresh token en la BD
          await revokeRefreshToken(decoded.usuarioId, refreshToken);
        }
      } catch (_) {
        // Ignorar errores si el token es inválido
      }
    }

    // Limpiar la cookie del refresh token
    clearRefreshCookie(res);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Error cerrando sesión" });
  }
}

module.exports = { loginController, refreshController, logoutController };
