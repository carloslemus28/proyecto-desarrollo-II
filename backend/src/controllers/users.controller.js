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

/**
 * GET /api/users - Lista todos los usuarios activos
 */
async function listUsersController(req, res) {
  try {
    const rows = await listUsers();
    res.json({ ok: true, users: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

/**
 * POST /api/users - Crea un nuevo usuario
 * Requiere: nombre, email, password, rol
 * Opcional: telefono
 */
async function createUserController(req, res) {
  try {
    const { nombre, email, telefono, password, rol } = req.body || {};

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
      password,
      rolNombre: rol,
    });

    res.status(201).json({ ok: true, usuarioId: r.usuarioId });
  } catch (e) {
    // Código de error MySQL para email duplicado
    if (e && (e.code === "ER_DUP_ENTRY" || String(e.message).includes("Duplicate"))) {
      return res.status(400).json({ ok: false, message: "El email ya está registrado" });
    }
    res.status(500).json({ ok: false, message: e.message });
  }
}

/**
 * PUT /api/users/:id - Actualiza datos básicos de usuario
 * Campos actualizables: nombre, telefono, activo
 */
async function updateUserController(req, res) {
  try {
    const usuarioId = Number(req.params.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }
    const { nombre, telefono, activo } = req.body || {};

    await updateUser(usuarioId, { nombre, telefono, activo });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

/**
 * PUT /api/users/:id/password - Reinicia la contraseña de un usuario
 * Requiere: nueva contraseña
 * Solo ADMIN puede hacer esto
 */
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
