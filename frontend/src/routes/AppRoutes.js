/**
 * Enrutador Principal de la Aplicación React
 * 
 * Responsabilidades:
 * - Definir todas las rutas de la aplicación
 * - Proteger rutas que requieren autenticación
 * - Validar roles para páginas de ADMIN
 * - Manejar redirecciones no autorizadas
 * 
 * Estructura de rutas:
 * - /login: Página de autenticación (pública)
 * - /: Dashboard (autenticado)
 * - /cases: Gestión de casos
 * - /users: Gestión de usuarios (solo ADMIN)
 * - /reports: Reportes (solo ADMIN)
 */

import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import AppLayout from "../layouts/AppLayout";
import CasesPage from "../pages/CasesPage";
import UsersPage from "../pages/UsersPage";
import DashboardPage from "../pages/Dashboard";
import ReportsPage from "../pages/ReportsPage";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../auth/AuthContext";

function AdminRoute({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");
  return isAdmin ? children : <Navigate to="/cases" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Publica */}
      <Route path="/login" element={<LoginPage />} />

      {/* Privadas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* si alguien entra a "/" -> lo mandamos al dashboard o a cases */}
          <Route path="/" element={<DashboardPage />} />

          <Route path="/cases" element={<CasesPage />} />

          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />

          {/* Reportes solo ADMIN */}
          <Route
            path="/reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/cases" replace />} />
    </Routes>
  );
}
