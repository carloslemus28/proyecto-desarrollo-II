/**
 * Middleware de autorización - Verifica permisos específicos del usuario
 * 
 * Responsabilidades:
 * - Inspeccionar permisos del usuario autenticado
 * - Validar que posea el permiso requerido
 * - Retornar 403 Forbidden si no tiene permisos
 * 
 * Uso: router.post("/endpoint", authRequired, requirePermission("PERMISSION_CODE"), controller)
 * 
 * @param {string} permissionCode - Código del permiso a verificar (ej: "USERS_MANAGE", "CASES_READ")
 * @returns {Function} Middleware de Express
 */

function requirePermission(permissionCode) {
  return (req, res, next) => {
    const permisos = req.user?.permisos || [];
    
    // Verificar que el usuario tenga el permiso requerido
    if (!permisos.includes(permissionCode)) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }
    next();
  };
}

module.exports = { requirePermission };
