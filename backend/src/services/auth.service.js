/**
 * Servicio de Autenticación - Lógica de validación y gestión de credenciales
 * 
 * Responsabilidades:
 * - Validar credenciales de usuario email y contraseña
 * - Obtener información de usuario por ID o email
 * - Verificar contraseñas con bcrypt
 * - Recuperar roles y permisos de usuario
 * 
 * Seguridad:
 * - Las contraseñas nunca se retornan directamente
 * - Se usa bcryptjs para hasheo contra fuerza bruta
 * - La contraseña se verifica mediante comparación de hash
 */

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function getUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT UsuarioId, Nombre, Email, PasswordHash, Activo
     FROM Usuarios
     WHERE Email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function getUserById(usuarioId) {
  const [rows] = await pool.execute(
    `SELECT UsuarioId, Nombre, Email, Activo
     FROM Usuarios
     WHERE UsuarioId = ?`,
    [usuarioId]
  );
  return rows[0] || null;
}

async function getUserRolesAndPermissions(usuarioId) {
  const [rolesRows] = await pool.execute(
    `SELECT r.Nombre
     FROM UsuariosRoles ur
     JOIN Roles r ON r.RolId = ur.RolId
     WHERE ur.UsuarioId = ?`,
    [usuarioId]
  );
  const roles = rolesRows.map((r) => r.Nombre);

  const [permRows] = await pool.execute(
    `SELECT DISTINCT p.Codigo
     FROM UsuariosRoles ur
     JOIN RolesPermisos rp ON rp.RolId = ur.RolId
     JOIN Permisos p ON p.PermisoId = rp.PermisoId
     WHERE ur.UsuarioId = ? AND p.Activo = 1`,
    [usuarioId]
  );
  const permisos = permRows.map((p) => p.Codigo);

  return { roles, permisos };
}

async function login(email, password) {
  const user = await getUserByEmail(email);
  if (!user || Number(user.Activo) !== 1) return null;

  const ok = await bcrypt.compare(password, user.PasswordHash);
  if (!ok) return null;

  const { roles, permisos } = await getUserRolesAndPermissions(user.UsuarioId);

  return {
    usuarioId: user.UsuarioId,
    nombre: user.Nombre,
    email: user.Email,
    roles,
    permisos,
  };
}

// devuelve info de sesión sin contraseña, roles y permisos para autorización
async function getUserSessionById(usuarioId) {
  const user = await getUserById(usuarioId);
  if (!user || Number(user.Activo) !== 1) return null;

  const { roles, permisos } = await getUserRolesAndPermissions(user.UsuarioId);

  return {
    usuarioId: user.UsuarioId,
    nombre: user.Nombre,
    email: user.Email,
    roles,
    permisos,
  };
}

module.exports = {
    login,
    getUserSessionById
};
