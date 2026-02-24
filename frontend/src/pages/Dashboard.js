/**
 * Página Dashboard - Página de inicio con resumen general
 * 
 * Responsabilidades:
 * - Mostrar bienvenida personalizada
 * - Acceso rápido a secciones principales
 * - Resumen de información relevante
 * 
 */

import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido {user.nombre}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
