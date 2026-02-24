/**
 * Componente ProtectedRoute - Protege rutas que requieren autenticación
 * 
 * Responsabilidades:
 * - Validar que el usuario esté autenticado
 * - Redirigir a login si no tiene sesión
 * - Renderizar contenido si está autenticado
 * 
 * Uso: <Route element={<ProtectedRoute />}><Route path="..." element={<Component />}</Route></Route>
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
