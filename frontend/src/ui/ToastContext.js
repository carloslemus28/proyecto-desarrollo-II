/**
 * Contexto de Notificaciones (Toast) - Sistema de mensajes flotantes
 * 
 * Responsabilidades:
 * - Mostrar notificaciones temporales al usuario
 * - Soportar múltiples notificaciones simultáneas
 * - Animaciones de entrada/salida con Anime.js
 * - Auto-cerrar tras tiempo configurado
 * - Tipos: success, error, info, warning
 * 
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { animate, remove } from "animejs";

const ToastCtx = createContext(null);
// ToastProvider es el componente que envuelve la aplicación y proporciona la función showToast a través del contexto
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toastRefs = useRef(new Map());
  const timersRef = useRef(new Map());
  const closingRef = useRef(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    const toastNodes = toastRefs.current;
    const closing = closingRef.current;

    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();

      toastNodes.clear();
      closing.clear();
    };
  }, []);
// Función para asignar o eliminar referencias de los elementos de toast, usada para animaciones
  function setToastRef(id, el) {
    if (!id) return;
    if (el) toastRefs.current.set(id, el);
    else toastRefs.current.delete(id);
  }
// Animación de entrada para un toast específico, usando Anime.js para animar opacidad, posición y escala
  function animateIn(el) {
    if (!el) return;
    remove(el);
    el.style.opacity = "0";
    el.style.transform = "translateY(10px) scale(0.98)";
    animate(el, {
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.98, 1],
      duration: 240,
      easing: "easeOutQuad",
    });
  }
// Animación de salida para un toast específico, usando Anime.js para animar opacidad y posición, y luego eliminar el elemento del DOM
  async function animateOut(el) {
    if (!el) return;
    remove(el);
    const a = animate(el, {
      opacity: [1, 0],
      translateX: [0, 10],
      duration: 180,
      easing: "easeInQuad",
    });
    if (a?.finished) await a.finished;
  }
// Función para limpiar el temporizador de auto-cierre de un toast específico, evitando que se cierre automáticamente si el usuario ya lo ha cerrado manualmente
  function clearTimer(id) {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }
// Función para cerrar un toast específico, con animación de salida y eliminación del estado después de la animación
  async function closeToast(id) {
    if (!id) return;
    if (closingRef.current.has(id)) return;

    closingRef.current.add(id);
    clearTimer(id);

    const el = toastRefs.current.get(id);
    await animateOut(el);

    setToasts((prev) => prev.filter((t) => t.id !== id));
    closingRef.current.delete(id);
  }
// Función para mostrar un nuevo toast, generando un ID único, agregándolo al estado de toasts, y configurando un temporizador para su cierre automático
  function showToast(message, type = "info", ms = 5000) {
    const id = crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());

    const toastObj = { id, message, type };
    setToasts((prev) => [...prev, toastObj]);

    const timer = setTimeout(() => closeToast(id), ms);
    timersRef.current.set(id, timer);
  }

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}

      <div style={wrap}>
        {toasts.map((t) => (
          <div
            key={t.id}
            ref={(el) => {
              setToastRef(t.id, el);
              if (el && !el.dataset.in) {
                el.dataset.in = "1";
                animateIn(el);
              }
            }}
            style={{ ...toast, ...variant(t.type) }}
            role="status"
            aria-live="polite"
          >
            <div style={toastRow}>
              <div style={{ lineHeight: 1.25 }}>{t.message}</div>

              <button
                onClick={() => closeToast(t.id)}
                style={toastCloseBtn}
                title="Cerrar"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
// Hook personalizado para acceder a la función showToast desde cualquier componente dentro del ToastProvider, lanzando un error si se usa fuera del contexto
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

const wrap = { position: "fixed", right: 16, bottom: 16, display: "grid", gap: 10, zIndex: 99999 };
const toast = { minWidth: 260, maxWidth: 360, padding: "12px 14px", borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 16px 40px rgba(0,0,0,0.12)", fontSize: 14, willChange: "transform, opacity" };
const toastRow = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 };
const toastCloseBtn = { border: "none", background: "transparent", cursor: "pointer", padding: 6, lineHeight: 1, borderRadius: 10, opacity: 0.75 };

function variant(type) {
  if (type === "success") return { borderColor: "#86efac", background: "#f0fdf4" };
  if (type === "error") return { borderColor: "#fecaca", background: "#fef2f2" };
  if (type === "warning") return { borderColor: "#fde68a", background: "#fffbeb" };
  return { borderColor: "#bfdbfe", background: "#eff6ff" };
}
