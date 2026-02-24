/**
 * Servicio de Autenticación Frontend - Llamadas API para autenticación
 * 
 * Responsabilidades:
 * - Llamadas HTTP para login
 * - Llamadas HTTP para logout
 * - Llamadas HTTP para refrescar token
 * 
 * Los tokens se guardan en sessionStorage y se inyectan en el cliente HTTP
 */

import api from "../api/axios";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
