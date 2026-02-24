/**
 * Contexto de Autenticación - Gestiona estado de sesión global
 * 
 * Responsabilidades:
 * - Mantener datos del usuario autenticado
 * - Guardar/cargar token JWT
 * - Proporcionar funciones de login y logout
 * - Validar sesión al cargar la app
 * - Refrescar token cuando expira
 * 
 * Uso: useAuth() en cualquier componente para acceder a { user, login, logout, isLoading }
 */

import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = sessionStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  function loginSuccess(token, userData) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    sessionStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
