/**
 * Controlador de Usuarios - Gestiona operaciones CRUD de usuarios
 * 
 * Responsabilidades:
 * - Listar usuarios activos
 * - Crear nuevos usuarios con rol asignado
 * - Actualizar datos básicos de usuario (nombre, teléfono, estado activo)
 * - Resetear contraseña de usuario
 * 
 * Acceso: Solo usuarios con roles ADMIN o permisos USERS_MANAGE
 */

const {
  listUsers,
  createUser,
  updateUser,
  resetPassword,
} = require("../services/users.service");

async function listUsersController(req, res) {
  try {
    const rows = await listUsers();
    res.json({ ok: true, users: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

async function createUserController(req, res) {
  try {
    const {
      nombre,
      email,
      telefono,
      telefonoPais,
      telefonoPrefijo,
      telefonoNumero,
      password,
      rol,
    } = req.body || {};

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        ok: false,
        message: "nombre, email, password y rol son requeridos",
      });
    }

    const r = await createUser({
      nombre,
      email,
      telefono,
      telefonoPais,
      telefonoPrefijo,
      telefonoNumero,
      password,
      rolNombre: rol,
    });

    res.status(201).json({ ok: true, usuarioId: r.usuarioId });
  } catch (e) {
    if (e && (e.code === "ER_DUP_ENTRY" || String(e.message).includes("Duplicate"))) {
      return res.status(400).json({ ok: false, message: "El email ya está registrado" });
    }
    res.status(500).json({ ok: false, message: e.message });
  }
}

async function updateUserController(req, res) {
  try {
    const usuarioId = Number(req.params.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const {
      nombre,
      telefono,
      telefonoPais,
      telefonoPrefijo,
      telefonoNumero,
      activo,
    } = req.body || {};

    await updateUser(usuarioId, {
      nombre,
      telefono,
      telefonoPais,
      telefonoPrefijo,
      telefonoNumero,
      activo,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

async function resetPasswordController(req, res) {
  try {
    const usuarioId = Number(req.params.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ ok: false, message: "Password requerido" });
    }

    await resetPassword(usuarioId, password);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

module.exports = {
  listUsersController,
  createUserController,
  updateUserController,
  resetPasswordController,
};