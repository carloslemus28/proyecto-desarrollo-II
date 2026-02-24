/**
 * Configuración de cliente HTTP usando axios
 * 
 * Responsabilidades:
 * - Crear instancia de axios configurada para la API
 * - Inyectar token JWT en todos los requests
 * - Manejar respuestas 401 (token expirado)
 * - Refrescar tokens automáticamente cuando sea necesario
 * - Almacenar nuevo token cuando se refresca
 * 
 * Url base: http://localhost:4000/api
 * Credenciales: incluidas en todas las peticiones para CORS
 */

// src/api/axios.js
import axios from "axios";
// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});
// Interceptor de solicitudes para agregar token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];
// Función para resolver o rechazar todas las promesas en espera después de intentar refrescar el token
function resolveQueue(error, token = null) {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
}
// Interceptor de respuestas para manejar expiración de token
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (error?.response?.status !== 401) return Promise.reject(error);
    
    if (original?.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }
    // evita reintentos infinitos si el refresh también falla
    if (original._retry) return Promise.reject(error);
    original._retry = true;

    // si ya se está refrescando, espera a que termine y luego reintenta la petición original
    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    refreshing = true;
    try {
      const res = await api.get("/auth/refresh");
      const newToken = res.data.token;
      const newUser = res.data.user;

      sessionStorage.setItem("token", newToken);
      sessionStorage.setItem("user", JSON.stringify(newUser));

      resolveQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      resolveQueue(err, null);

      // Toast pendiente para mostrar en /login 
      sessionStorage.setItem(
        "sessionExpiredToast",
        JSON.stringify({
          message: "Tu sesión ha expirado, inicia sesión nuevamente",
          type: "warning",
        })
      );

      //limpia sesión 
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("loginToast");

      //Redirige a login
      window.location.href = "/login";

      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  }
);

export default api;
