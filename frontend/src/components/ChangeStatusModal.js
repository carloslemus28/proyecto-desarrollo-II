/**
 * Componente ChangeStatusModal - Modal para cambiar estado del caso
 * 
 * Responsabilidades:
 * - Mostrar estados disponibles
 * - Seleccionar nuevo estado
 * - Llamar API para actualizar estado
 * - Mostrar transición visual
 * 
 * Estados soportados:
 * - NUEVO: caso recién creado
 * - EN_GESTION: en seguimiento activo
 * - PROMESA_PAGO: deudor se comprometió a pagar
 * - INCUMPLIDO: no cumplió promesa
 * - CERRADO: caso finalizado
 * 
 * Props:
 * - caseId: ID del caso
 * - currentStatus: estado actual
 * - isOpen: mostrar u ocultar
 * - onClose/onSuccess: callbacks
 */

// src/components/ChangeStatusModal.js
import { useEffect, useRef, useState } from "react";
import { animate, remove } from "animejs";

const ESTADOS = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "EN_GESTION", label: "En gestión" },
  { value: "PROMESA_PAGO", label: "Promesa de pago" },
  { value: "INCUMPLIDO", label: "Incumplido" },
  { value: "CERRADO", label: "Cerrado" },
];
// función para obtener etiqueta de estado
export default function ChangeStatusModal({
  open,
  onClose,
  caseData,
  caseId,
  currentStatus,
  onConfirm,
}) {
  const [mounted, setMounted] = useState(false);
  const [estadoCodigo, setEstadoCodigo] = useState(currentStatus || "NUEVO");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    setEstadoCodigo(currentStatus || caseData?.EstadoCodigo || "NUEVO");
  }, [open, currentStatus, caseData]);

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

      animate(overlayEl, { opacity: [0, 1] }, { duration: 180, easing: "easeOutQuad" });
      animate(
        modalEl,
        { opacity: [0, 1], translateY: [14, 0], scale: [0.99, 1] },
        { duration: 220, easing: "easeOutQuad" }
      );
    } else {
      animate(overlayEl, { opacity: [1, 0] }, { duration: 160, easing: "easeInQuad" });
      const a = animate(
        modalEl,
        { opacity: [1, 0], translateY: [0, 10], scale: [1, 0.99] },
        { duration: 170, easing: "easeInQuad" }
      );

      (a?.finished ? a.finished : Promise.resolve()).then(() => setMounted(false));
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open || saving) return;
    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saving]);

  function close() {
    if (saving) return;
    onClose?.();
  }
// función para manejar guardado de nuevo estado
  async function handleSave() {
    setError("");
    try {
      setSaving(true);
      await onConfirm?.(estadoCodigo);
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo cambiar el estado.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  const titulo = "Cambiar estado del caso";
  const subtitulo = caseData?.CodigoCaso || (caseId ? `Caso #${caseId}` : "");

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
            <div style={{ fontSize: 16, fontWeight: 800 }}>{titulo}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{subtitulo}</div>
          </div>

          <button disabled={saving} onClick={close} style={closeBtn}>
            Cerrar ✕
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {error ? (
            <div style={errorBox}>
              <b>Error:</b> {error}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Nuevo estado</div>
            <select
              value={estadoCodigo}
              onChange={(e) => setEstadoCodigo(e.target.value)}
              disabled={saving}
              style={input}
            >
              {ESTADOS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={footer}>
          <button onClick={close} disabled={saving} style={softBtn}>
            Cancelar
          </button>

          <button onClick={handleSave} disabled={saving} style={primaryBtn}>
            {saving ? "Guardando..." : "Guardar estado"}
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
  maxWidth: "92vw",
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
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

const errorBox = {
  background: "#ffe6e6",
  border: "1px solid #ffc2c2",
  padding: 10,
  borderRadius: 12,
  marginBottom: 12,
};
