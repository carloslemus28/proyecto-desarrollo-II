/**
 * Servicio de Refresh Tokens - Gestión segura de tokens de refresco
 * 
 * Responsabilidades:
 * - Guardar refresh tokens en BD (hashados para seguridad)
 * - Verificar validez de refresh tokens (no revocados ni expirados)
 * - Revocar tokens individuales o en lote
 * - Mantener auditoría de sesiones activas
 * 
 * Seguridad:
 * - Tokens se hasean antes de guardar en BD
 * - Se guarda fecha de expiración para limpieza automática
 * - Rotación de tokens: cada uso invalida el anterior
 */

const crypto = require("crypto");
const { pool } = require("../config/db");

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function saveRefreshToken(usuarioId, refreshToken, expiresAt) {
  const tokenHash = sha256(refreshToken);
  await pool.execute(
    `INSERT INTO RefreshTokens (UsuarioId, TokenHash, ExpiresAt)
     VALUES (?, ?, ?)`,
    [usuarioId, tokenHash, expiresAt]
  );
}

async function findValidRefreshToken(usuarioId, refreshToken) {
  const tokenHash = sha256(refreshToken);
  const [rows] = await pool.execute(
    `SELECT TokenId, ExpiresAt, RevokedAt
     FROM RefreshTokens
     WHERE UsuarioId = ? AND TokenHash = ? LIMIT 1`,
    [usuarioId, tokenHash]
  );

  const t = rows[0];
  if (!t) return null;
  if (t.RevokedAt) return null;

  const exp = new Date(t.ExpiresAt);
  if (Number.isNaN(exp.getTime())) return null;
  if (exp.getTime() < Date.now()) return null;

  return t;
}

async function revokeRefreshToken(usuarioId, refreshToken) {
  const tokenHash = sha256(refreshToken);
  await pool.execute(
    `UPDATE RefreshTokens
     SET RevokedAt = NOW()
     WHERE UsuarioId = ? AND TokenHash = ? AND RevokedAt IS NULL`,
    [usuarioId, tokenHash]
  );
}

async function revokeAllUserRefreshTokens(usuarioId) {
  await pool.execute(
    `UPDATE RefreshTokens
     SET RevokedAt = NOW()
     WHERE UsuarioId = ? AND RevokedAt IS NULL`,
    [usuarioId]
  );
}

module.exports = {
  saveRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};
