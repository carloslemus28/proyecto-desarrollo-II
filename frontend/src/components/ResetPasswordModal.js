/**
 * Componente ResetPasswordModal - Modal para cambiar contraseña de usuario
 * 
 * Responsabilidades:
 * - Formulario simple de nueva contraseña
 * - Validar contraseña que no esté vacía
 * - Llamar API para resetear contraseña
 * - Solo ADMIN puede resetear contraseña de otros
 * 
 * Props:
 * - open: mostrar u ocultar
 * - onClose: callback al cerrar
 * - userTarget: usuario al cual resetear password
 * - onConfirm: callback tras actualizar
 * - loading: mostrar estado de carga
 */

import { useEffect, useState } from "react";

export default function ResetPasswordModal({ open, onClose, userTarget, onConfirm, loading }) {
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setPass1("");
    setPass2("");
    setError("");
  }, [open]);

  function close() {
    if (loading) return;
    onClose?.();
  }

  async function handleConfirm() {
    setError("");

    if (!pass1.trim() || !pass2.trim()) {
      setError("Debes completar ambos campos.");
      return;
    }
    if (pass1 !== pass2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (pass1.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    await onConfirm?.(pass1);
  }

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={overlay}
    >
      <div style={modal}>
        <div style={header}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Cambiar Contraseña</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {userTarget?.Email || "Usuario"}
            </div>
          </div>

          <button onClick={close} style={closeBtn}>
            Cerrar ✕
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {error ? (
            <div style={errorBox}>
              <b>Error:</b> {error}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 10 }}>
            <Field label="Nueva contraseña">
              <input
                type="password"
                value={pass1}
                onChange={(e) => setPass1(e.target.value)}
                style={input}
                placeholder="Escribe la nueva contraseña"
              />
            </Field>

            <Field label="Confirmar contraseña">
              <input
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                style={input}
                placeholder="Confirma la contraseña"
              />
            </Field>
          </div>
        </div>

        <div style={footer}>
          <button onClick={close} disabled={loading} style={softBtn}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading} style={primaryBtn}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      {children}
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
  background: "#fff",
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
};

const softBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
};

const errorBox = {
  background: "#ffe6e6",
  border: "1px solid #ffc2c2",
  padding: 10,
  borderRadius: 12,
  marginBottom: 12,
};
