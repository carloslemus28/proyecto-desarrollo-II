/**
 * Componente ConfirmModal - Diálogo de confirmación reutilizable
 * 
 * Responsabilidades:
 * - Mostrar modal de confirmación
 * - Realizar acción si se confirma
 * - Manejar animaciones suavemente
 * - Soportar estado de carga durante acción
 * 
 * Props:
 * - isOpen: mostrar u ocultar modal
 * - titulo, mensaje: contenido
 * - onConfirm: callback al confirmar
 * - onCancel: callback al cancelar/cerrar
 * - isLoading: mostrar spinner durante acción
 * - isDanger: estilo rojo para acciones peligrosas
 * 
 * Animaciones:
 * - Fade-in del fondo
 * - Zoom-in del modal
 */

import { useEffect, useRef, useState } from "react";
import { animate, remove } from "animejs";

export default function ConfirmModal({
  open,
  title = "Confirmar",
  message = "¿Estás seguro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [mounted, setMounted] = useState(false);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const btnCloseRef = useRef(null);
  const btnCancelRef = useRef(null);
  const btnConfirmRef = useRef(null);

  // Montar cuando abre (para permitir animación de salida)
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Entrada / salida
  useEffect(() => {
    if (!mounted) return;

    const overlayEl = overlayRef.current;
    const modalEl = modalRef.current;
    if (!overlayEl || !modalEl) return;

    remove([overlayEl, modalEl]);

    if (open) {
      // estado inicial
      overlayEl.style.opacity = "0";
      modalEl.style.opacity = "0";
      modalEl.style.transform = "translateY(14px) scale(0.98)";

      animate(overlayEl, {
        opacity: [0, 1],
        duration: 180,
        easing: "easeOutQuad",
      });

      animate(modalEl, {
        opacity: [0, 1],
        translateY: [14, 0],
        scale: [0.98, 1],
        duration: 220,
        easing: "easeOutQuad",
      });
    } else {
      // salida
      animate(overlayEl, {
        opacity: [1, 0],
        duration: 160,
        easing: "easeInQuad",
      });

      const anim = animate(modalEl, {
        opacity: [1, 0],
        translateY: [0, 10],
        scale: [1, 0.98],
        duration: 170,
        easing: "easeInQuad",
      });

      // desmontar al terminar
      (anim?.finished ? anim.finished : Promise.resolve()).then(() => {
        setMounted(false);
      });
    }
  }, [open, mounted]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape" && !loading) onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  // helpers animaciones botones
  function press(ref) {
    const el = ref.current;
    if (!el || loading) return;
    remove(el);
    animate(el, {
      scale: [1, 0.97, 1],
      duration: 170,
      easing: "easeOutQuad",
    });
  }

  function hoverIn(ref, { dangerMode = false } = {}) {
    const el = ref.current;
    if (!el || loading) return;
    remove(el);

    if (dangerMode) {
      // animación para botón
      animate(el, {
        scale: 1.03,
        translateX: [0, -1, 1, -1, 1, 0],
        duration: 220,
        easing: "easeOutQuad",
      });
    } else {
      animate(el, {
        scale: 1.02,
        duration: 160,
        easing: "easeOutQuad",
      });
    }
  }
// función para animación hover
  function hoverOut(ref) {
    const el = ref.current;
    if (!el) return;
    remove(el);
    animate(el, {
      scale: 1,
      translateX: 0,
      duration: 160,
      easing: "easeOutQuad",
    });
  }

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
      }}
      style={overlay}
    >
      <div ref={modalRef} style={modal}>
        <div style={header}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>

          <button
            ref={btnCloseRef}
            onClick={() => !loading && onClose?.()}
            onMouseEnter={() => hoverIn(btnCloseRef)}
            onMouseLeave={() => hoverOut(btnCloseRef)}
            style={closeBtn}
          >
            Cerrar
          </button>
        </div>

        <div style={{ padding: 16, fontSize: 14, opacity: 0.9 }}>{message}</div>

        <div style={footer}>
          <button
            ref={btnCancelRef}
            disabled={loading}
            onClick={() => onClose?.()}
            onMouseEnter={() => hoverIn(btnCancelRef)}
            onMouseLeave={() => hoverOut(btnCancelRef)}
            onMouseDown={() => press(btnCancelRef)}
            style={{
              ...softBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {cancelText}
          </button>

          <button
            ref={btnConfirmRef}
            disabled={loading}
            onClick={() => onConfirm?.()}
            onMouseEnter={() => hoverIn(btnConfirmRef, { dangerMode: danger })}
            onMouseLeave={() => hoverOut(btnConfirmRef)}
            onMouseDown={() => press(btnConfirmRef)}
            style={{
              ...primaryBtn,
              background: danger ? "#ef4444" : "#111827",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "grid",
  placeItems: "center",
  padding: 16,
  zIndex: 9999,
};

const modal = {
  width: 520,
  maxWidth: "100%",
  background: "#fff",
  borderRadius: 14,
  overflow: "hidden",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  border: "1px solid #e5e7eb",
  willChange: "transform, opacity",
};

const header = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  background: "#f8fafc",
};

const footer = {
  padding: "12px 16px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const closeBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  transform: "scale(1)",
  willChange: "transform",
};

const softBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  transform: "scale(1)",
  willChange: "transform",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  color: "#fff",
  transform: "scale(1)",
  willChange: "transform",
};
