/**
 * Utilidades para manejo de tokens JWT (JSON Web Tokens)
 * 
 * Responsabilidades:
 * - Generar tokens de acceso (corta duración: 15 minutos)
 * - Generar tokens de refresco (larga duración: 7 días)
 * - Verificar y decodificar tokens de acceso
 * - Verificar y decodificar tokens de refresco
 * 
 * Variables de entorno:
 * - JWT_SECRET: Clave secreta para access tokens
 * - JWT_REFRESH_SECRET: Clave secreta para refresh tokens
 */

const jwt = require("jsonwebtoken");

/**
 * Genera un token de acceso (duración: 15 minutos)
 * @param {Object} payload - Datos a incluir en el token (usuarioId, nombre, email, roles, permisos)
 * @returns {string} Token JWT firmado
 */
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Genera un token de refresco (duración: 7 días)
 * Se usa para obtener nuevos access tokens sin reautenticar
 * @param {Object} payload - Datos a incluir en el token (usuarioId)
 * @returns {string} Token JWT firmado
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

/**
 * Verifica y decodifica un token de acceso
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido o expirado
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Verifica y decodifica un token de refresco
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido o expirado
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
