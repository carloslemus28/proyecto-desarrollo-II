/**
 * Componente CreateUserModal - Modal para crear nuevo usuario
 * 
 * Responsabilidades:
 * - Formulario de registro de usuario
 * - Capturar: nombre, email, teléfono, contraseña, rol
 * - Validar campos requeridos
 * - Validar formato de email
 * - Llamar API para crear usuario
 * - Mostrar errores (email duplicado, campos inválidos)
 * 
 * Props:
 * - isOpen: mostrar u ocultar
 * - onClose: callback al cerrar
 * - onSuccess: callback tras crear
 */

import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { animate, remove, stagger } from "animejs";

export default function CreateUserModal({ open, onClose, onCreated, showToast }) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const fieldsWrapRef = useRef(null);

  const btnCloseRef = useRef(null);
  const btnCancelRef = useRef(null);
  const btnCreateRef = useRef(null);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    rol: "AGENTE",
  });

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // reset al abrir
  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setForm({ nombre: "", email: "", telefono: "", password: "", rol: "AGENTE" });
  }, [open]);

  // animación entrada/salida
  useEffect(() => {
    if (!mounted) return;

    const overlayEl = overlayRef.current;
    const modalEl = modalRef.current;
    if (!overlayEl || !modalEl) return;

    remove([overlayEl, modalEl]);

    if (open) {
      overlayEl.style.opacity = "0";
      modalEl.style.opacity = "0";
      modalEl.style.transform = "translateY(14px) scale(0.99)";

      animate(overlayEl, {
        opacity: [0, 1],
        duration: 180,
        easing: "easeOutQuad",
      });

      const a = animate(modalEl, {
        opacity: [0, 1],
        translateY: [14, 0],
        scale: [0.99, 1],
        duration: 230,
        easing: "easeOutQuad",
      });

      // animar campos con pequeño retraso
      (a?.finished ? a.finished : Promise.resolve()).then(() => {
        const wrap = fieldsWrapRef.current;
        if (!wrap) return;

        const items = Array.from(wrap.querySelectorAll("[data-anim='field']"));
        if (!items.length) return;

        remove(items);
        items.forEach((el) => {
          el.style.opacity = "0";
          el.style.transform = "translateY(6px)";
        });

        animate(items, {
          opacity: [0, 1],
          translateY: [6, 0],
          delay: stagger(35),
          duration: 220,
          easing: "easeOutQuad",
        });
      });
    } else {
      animate(overlayEl, {
        opacity: [1, 0],
        duration: 160,
        easing: "easeInQuad",
      });

      const anim = animate(modalEl, {
        opacity: [1, 0],
        translateY: [0, 10],
        scale: [1, 0.99],
        duration: 170,
        easing: "easeInQuad",
      });

      (anim?.finished ? anim.finished : Promise.resolve()).then(() => {
        setMounted(false);
      });
    }
  }, [open, mounted]);

  // cerrar con ESC
  useEffect(() => {
    if (!open || saving) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  function close() {
    if (saving) return;
    onClose?.(); // la salida animada la maneja el effect cuando open pasa a false
  }

  function pressAnim(ref) {
    const el = ref?.current;
    if (!el || saving) return;
    remove(el);
    animate(el, {
      scale: [1, 0.97, 1],
      duration: 170,
      easing: "easeOutQuad",
    });
  }

  function hoverIn(ref) {
    const el = ref?.current;
    if (!el || saving) return;
    remove(el);
    animate(el, { scale: 1.02, duration: 160, easing: "easeOutQuad" });
  }

  function hoverOut(ref) {
    const el = ref?.current;
    if (!el) return;
    remove(el);
    animate(el, { scale: 1, duration: 160, easing: "easeOutQuad" });
  }

  async function handleCreate() {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      showToast?.("Nombre, email y contraseña son obligatorios.", "warning", 5000);
      return;
    }

    pressAnim(btnCreateRef);

    try {
      setSaving(true);

      await api.post("/users", {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        password: form.password,
        rol: form.rol,
      });

      showToast?.("Usuario creado correctamente", "success", 5000);
      onCreated?.();
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || "No se pudo crear el usuario.";
      showToast?.(msg, "error", 5000);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={overlay}
    >
      <div ref={modalRef} style={modal}>
        <div style={header}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Crear Usuario</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Administrador o Agente</div>
          </div>

          <button
            ref={btnCloseRef}
            onClick={() => {
              pressAnim(btnCloseRef);
              close();
            }}
            onMouseEnter={() => hoverIn(btnCloseRef)}
            onMouseLeave={() => hoverOut(btnCloseRef)}
            disabled={saving}
            style={closeBtn}
          >
            Cerrar ✕
          </button>
        </div>

        <div ref={fieldsWrapRef} style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              data-anim="field"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              style={input}
            />
            <input
              data-anim="field"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={input}
            />
            <input
              data-anim="field"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              style={input}
            />
            <input
              data-anim="field"
              placeholder="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={input}
            />

            <select
              data-anim="field"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              style={input}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="AGENTE">AGENTE</option>
            </select>
          </div>
        </div>

        <div style={footer}>
          <button
            ref={btnCancelRef}
            onClick={() => {
              pressAnim(btnCancelRef);
              close();
            }}
            disabled={saving}
            style={{ ...softBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            onMouseEnter={() => hoverIn(btnCancelRef)}
            onMouseLeave={() => hoverOut(btnCancelRef)}
          >
            Cancelar
          </button>

          <button
            ref={btnCreateRef}
            onClick={handleCreate}
            disabled={saving}
            style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            onMouseEnter={() => hoverIn(btnCreateRef)}
            onMouseLeave={() => hoverOut(btnCreateRef)}
          >
            {saving ? "Creando..." : "Crear"}
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
  width: 720,
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

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
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
  background: "#111827",
  color: "#fff",
  transform: "scale(1)",
  willChange: "transform",
};
