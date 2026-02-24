/**
 * Componente Raíz de la Aplicación en React
 * 
 * Responsabilidades:
 * - Proporcionar contexto de autenticación a toda la aplicación
 * - Inyectar sistema de notificaciones (toast)
 * - Renderizar rutas según autenticación y permisos
 * - Mostrar notificaciones de login en la primera carga
 * 
 * Estructura:
 * - AuthProvider: Contexto global de autenticación
 * - ToastProvider: Sistema de notificaciones
 * - AppRoutes: Rutas protegidas y públicas
 */

import { useEffect } from "react";
import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { ToastProvider, useToast } from "./ui/ToastContext";

/**
 * Componente que escucha y muestra notificaciones de login
 * Se usa para mostrar mensajes tras redireccionar desde login
 */
function LoginToastListener() {
  const { showToast } = useToast();

  useEffect(() => {
    // Obtener mensaje de toast almacenado en sessionStorage
    const raw = sessionStorage.getItem("loginToast");
    if (!raw) return;

    try {
      const { message, type } = JSON.parse(raw);
      showToast(message, type || "success", 5000);
    } catch (_) {
      // Ignorar errores de parsing
    } finally {
      // Limpiar mensaje después de mostrar
      sessionStorage.removeItem("loginToast");
    }
  }, [showToast]);

  return null;
}

/**
 * Componente principal de la aplicación
 * Envuelve toda la aplicación con proveedores de contexto
 */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LoginToastListener />
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
