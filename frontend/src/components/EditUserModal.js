/**
 * Componente EditUserModal - Modal para editar usuario existente
 * 
 * Responsabilidades:
 * - Formulario pre-llenado con datos del usuario
 * - Editar: nombre, teléfono, estado activo
 * - No editar email (campo de identidad)
 * - Validar cambios
 * - Llamar API para actualizar
 * - Mostrar confirmación de cambios
 * 
 * Props:
 * - userId: ID del usuario a editar
 * - isOpen: mostrar u ocultar
 * - onClose: callback al cerrar
 * - onSuccess: callback tras actualizar
 */

import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { animate, remove, stagger } from "animejs";

export default function EditUserModal({ open, onClose, userTarget, onSaved, showToast }) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const btnCloseRef = useRef(null);
  const btnCancelRef = useRef(null);
  const btnSaveRef = useRef(null);

  const fieldsWrapRef = useRef(null);
  const passBlockRef = useRef(null);

  const [edit, setEdit] = useState({
    nombre: "",
    telefono: "",
  });

  const [changePass, setChangePass] = useState(false);
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  // montar cuando open=true para permitir animación de salida
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setEdit({
      nombre: userTarget?.Nombre || "",
      telefono: userTarget?.Telefono || "",
    });

    // reset password section
    setChangePass(false);
    setPass1("");
    setPass2("");
    setShowPass1(false);
    setShowPass2(false);
  }, [open, userTarget]);

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

      // stagger de campos al abrir
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
    onClose?.();
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

  // animar bloque de contraseña al activar/desactivar
  useEffect(() => {
    const el = passBlockRef.current;
    if (!el) return;

    remove(el);

    if (changePass) {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
      animate(el, {
        opacity: [0, 1],
        translateY: [6, 0],
        duration: 200,
        easing: "easeOutQuad",
      });
    } else {
      // solo una mini salida visual, pero se queda montado (disabled)
      animate(el, {
        opacity: [1, 0.6],
        duration: 140,
        easing: "easeOutQuad",
      });
    }
  }, [changePass]);

  async function handleSave() {
    if (!edit.nombre.trim()) {
      showToast?.("El nombre es obligatorio.", "warning", 5000);
      return;
    }

    if (changePass) {
      if (!pass1.trim() || !pass2.trim()) {
        showToast?.("Debes completar ambas contraseñas.", "warning", 5000);
        return;
      }
      if (pass1 !== pass2) {
        showToast?.("Las contraseñas no coinciden.", "warning", 5000);
        return;
      }
      if (pass1.length < 6) {
        showToast?.("La contraseña debe tener al menos 6 caracteres.", "warning", 5000);
        return;
      }
    }

    pressAnim(btnSaveRef);

    try {
      setSaving(true);

      // 1) actualizar datos del usuario
      await api.put(`/users/${userTarget.UsuarioId}`, {
        nombre: edit.nombre.trim(),
        telefono: edit.telefono.trim() || null,
      });

      // 2) opcional: cambiar contraseña
      if (changePass) {
        await api.put(`/users/${userTarget.UsuarioId}/password`, {
          password: pass1,
        });
      }

      showToast?.(
        changePass ? "Usuario y contraseña actualizados" : "Usuario actualizado correctamente",
        "success",
        5000
      );

      await onSaved?.();
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data?.message || "No se pudieron guardar los cambios del usuario.";
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
            <div style={{ fontSize: 16, fontWeight: 800 }}>Editar Usuario</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{userTarget?.Email}</div>
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
          <div style={{ display: "grid", gap: 12 }}>
            {/* datos usuario */}
            <div data-anim="field" style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Nombre</div>
              <input
                value={edit.nombre}
                onChange={(e) => setEdit({ ...edit, nombre: e.target.value })}
                style={input}
              />
            </div>

            <div data-anim="field" style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Teléfono</div>
              <input
                value={edit.telefono}
                onChange={(e) => setEdit({ ...edit, telefono: e.target.value })}
                style={input}
              />
            </div>

            {/* checkbox cambiar contraseña */}
            <label data-anim="field" style={checkRow}>
              <input
                type="checkbox"
                checked={changePass}
                onChange={(e) => {
                  const v = e.target.checked;
                  setChangePass(v);
                  if (!v) {
                    setPass1("");
                    setPass2("");
                    setShowPass1(false);
                    setShowPass2(false);
                  }
                }}
              />
              <span style={{ fontSize: 13 }}>¿Cambiar contraseña?</span>
            </label>

            {/* inputs contraseña */}
            <div
              ref={passBlockRef}
              data-anim="field"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                opacity: changePass ? 1 : 0.6,
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Nueva contraseña</div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass1 ? "text" : "password"}
                    value={pass1}
                    onChange={(e) => setPass1(e.target.value)}
                    style={input}
                    disabled={!changePass}
                    placeholder="Nueva contraseña"
                  />
                  <span
                    role="button"
                    aria-label={showPass1 ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={0}
                    onClick={() => setShowPass1((s) => !s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setShowPass1((s) => !s);
                      }
                    }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#666",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPass1 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M12 8a4 4 0 014 4m0 0a4 4 0 01-4 4m0-8a4 4 0 00-4 4m0 0a4 4 0 004 4m6 2a9 9 0 01-6 2.5M6 6a9 9 0 016-2.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Confirmar contraseña</div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass2 ? "text" : "password"}
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                    style={input}
                    disabled={!changePass}
                    placeholder="Confirmar contraseña"
                  />
                  <span
                    role="button"
                    aria-label={showPass2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={0}
                    onClick={() => setShowPass2((s) => !s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setShowPass2((s) => !s);
                      }
                    }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#666",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPass2 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M12 8a4 4 0 014 4m0 0a4 4 0 01-4 4m0-8a4 4 0 00-4 4m0 0a4 4 0 004 4m6 2a9 9 0 01-6 2.5M6 6a9 9 0 016-2.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            </div>
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
            ref={btnSaveRef}
            onClick={handleSave}
            disabled={saving}
            style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            onMouseEnter={() => hoverIn(btnSaveRef)}
            onMouseLeave={() => hoverOut(btnSaveRef)}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----- estilos ----- */
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
  width: 640,
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

const checkRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
};
