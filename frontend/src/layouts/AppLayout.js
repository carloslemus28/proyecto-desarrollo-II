/**
 * Componente AppLayout - Layout principal de la aplicación autenticada
 * 
 * Responsabilidades:
 * - Renderizar estructura de dos columnas sidebar y contenido
 * - Mostrar información del usuario actual
 * - Navegar entre secciones
 * - Manejar logout
 * 
 * Estructura:
 * - Sidebar izquierdo: menú de navegación
 * - Área principal: renderiza páginas anidadas
 * - Kit de iconos: React Icons
 */

import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect } from "react";
import { useToast } from "../ui/ToastContext";
import {
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChartBar,
} from "react-icons/hi2";

export default function AppLayout() {
  // Autenticación y notificaciones
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.roles?.includes("ADMIN");
  const location = useLocation();

  useEffect(() => {
    const raw = sessionStorage.getItem("loginToast");
    if (!raw) return;

    try {
      const t = JSON.parse(raw);
      if (t?.message) showToast(t.message, t.type || "success", 4500);
    } catch (_) {}

    sessionStorage.removeItem("loginToast");
  }, [showToast]);
// Menú de navegación
  const menu = [
    { to: "/cases", label: "Casos", icon: <HiOutlineBriefcase size={18} /> },
    ...(isAdmin
      ? [
          { to: "/users", label: "Usuarios", icon: <HiOutlineUsers size={18} /> },
          { to: "/reports", label: "Reportes", icon: <HiOutlineChartBar size={18} /> }, // ✅
        ]
      : []),
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 16, background: "#111827", color: "#fff" }}>
        <h2 style={{ marginBottom: 10 }}>Cobranza</h2>

        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
          <div><b>{user?.nombre}</b></div>
          <div>{user?.email}</div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>Rol: {user?.roles?.join(", ")}</div>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          {menu.map((m) => {
            const active = location.pathname === m.to;
            return (
              <Link
                key={m.to}
                to={m.to}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  padding: "10px 10px",
                  borderRadius: 10,
                  background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "grid", placeItems: "center", opacity: active ? 1 : 0.9 }}>
                    {m.icon}
                  </span>
                  <span>{m.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 18,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#111827",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontWeight: 600,
          }}
        >
          <HiOutlineArrowRightOnRectangle size={18} />
          Cerrar sesión
        </button>
      </aside>

      <main style={{ padding: 18, background: "#f5f6fa" }}>
        <Outlet />
      </main>
    </div>
  );
}
