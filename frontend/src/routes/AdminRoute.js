/**
 * Componente AdminRoute - Protege rutas que requieren rol ADMIN
 * 
 * Responsabilidades:
 * - Validar autenticación
 * - Validar que el usuario tenga rol ADMIN
 * - Redirigir a /cases si no es admin
 * - Redirigir a /login si no está autenticado
 * 
 * Uso: Envolver rutas exclusivas de ADMIN como /users, /reports
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
// AdminRoute es un componente de ruta protegida que verifica si el usuario tiene el rol ADMIN
export default function AdminRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user?.roles?.includes("ADMIN");
  return isAdmin ? <Outlet /> : <Navigate to="/cases" replace />;
}
