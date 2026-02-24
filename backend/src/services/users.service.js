/**
 * Servicio de Usuarios - Operaciones CRUD de gestión de usuarios
 * 
 * Responsabilidades:
 * - Crear nuevos usuarios con rol asignado
 * - Listar usuarios activos
 * - Actualizar datos de usuario (nombre, teléfono, estado)
 * - Resetear contraseña del usuario
 * - Verificar duplicación de email
 * 
 * Acceso: Solo funciones de controlador con permisos ADMIN/USERS_MANAGE
 */

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function listUsers() {
  const [rows] = await pool.execute(
    `SELECT 
      u.UsuarioId,
      u.Nombre,
      u.Email,
      u.Telefono,
      u.Activo,
      r.Nombre AS Rol
    FROM Usuarios u
    JOIN UsuariosRoles ur ON ur.UsuarioId = u.UsuarioId
    JOIN Roles r ON r.RolId = ur.RolId
    ORDER BY u.UsuarioId DESC;
    `
  );
  return rows;
}

async function createUser({ nombre, email, telefono, password, rolNombre }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ins] = await conn.execute(
      `INSERT INTO Usuarios (Nombre, Email, PasswordHash, Telefono, Activo)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre, email, passwordHash, telefono || null]
    );
    const usuarioId = ins.insertId;
    const [roles] = await conn.execute(
      `SELECT RolId FROM Roles WHERE Nombre = ? AND Activo = 1`,
      [rolNombre]
    );
    if (!roles[0]) throw new Error("Rol inválido");

    await conn.execute(
      `INSERT INTO UsuariosRoles (UsuarioId, RolId) VALUES (?, ?)`,
      [usuarioId, roles[0].RolId]
    );

    await conn.commit();
    return { usuarioId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function updateUser(usuarioId, { nombre, telefono, activo }) {
  const fields = [];
  const values = [];

  if (nombre !== undefined) {
    fields.push("Nombre = ?");
    values.push(nombre.trim());
  }
  if (telefono !== undefined) {
    fields.push("Telefono = ?");
    values.push(telefono === "" ? null : telefono);
  }
  if (activo !== undefined) {
    fields.push("Activo = ?");
    values.push(activo ? 1 : 0);
  }

  if (fields.length === 0) return;

  values.push(usuarioId);

  await pool.execute(
    `UPDATE Usuarios SET ${fields.join(", ")} WHERE UsuarioId = ?`,
    values
  );
}

async function resetPassword(usuarioId, newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.execute(
    `UPDATE Usuarios SET PasswordHash = ? WHERE UsuarioId = ?`,
    [hash, usuarioId]
  );
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  resetPassword,
};
