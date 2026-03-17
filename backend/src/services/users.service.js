const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function listUsers() {
  const [rows] = await pool.execute(
    `SELECT 
      u.UsuarioId,
      u.Nombre,
      u.Email,
      u.TelefonoPais,
      u.TelefonoPrefijo,
      u.TelefonoNumero,
      u.Activo,
      r.Nombre AS Rol
    FROM Usuarios u
    LEFT JOIN UsuariosRoles ur ON ur.UsuarioId = u.UsuarioId
    LEFT JOIN Roles r ON r.RolId = ur.RolId
    ORDER BY u.UsuarioId DESC`
  );
  return rows;
}

async function createUser({
  nombre,
  email,
  telefono,
  telefonoPais,
  telefonoPrefijo,
  telefonoNumero,
  password,
  rolNombre
}) {
  const passwordHash = await bcrypt.hash(password, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ins] = await conn.execute(
      `INSERT INTO Usuarios (
        Nombre, Email, PasswordHash,
        TelefonoPais, TelefonoPrefijo, TelefonoNumero,
        Activo
      )
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        nombre,
        email,
        passwordHash,
        telefonoPais || null,
        telefonoPrefijo || null,
        telefonoNumero || null,
      ]
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

async function updateUser(usuarioId, {
  nombre,
  telefonoPais,
  telefonoPrefijo,
  telefonoNumero,
  activo
}) {
  const fields = [];
  const values = [];

  if (nombre !== undefined) {
    fields.push("Nombre = ?");
    values.push(nombre.trim());
  }
  if (telefonoPais !== undefined) {
    fields.push("TelefonoPais = ?");
    values.push(telefonoPais === "" ? null : telefonoPais);
  }
  if (telefonoPrefijo !== undefined) {
    fields.push("TelefonoPrefijo = ?");
    values.push(telefonoPrefijo === "" ? null : telefonoPrefijo);
  }
  if (telefonoNumero !== undefined) {
    fields.push("TelefonoNumero = ?");
    values.push(telefonoNumero === "" ? null : telefonoNumero);
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