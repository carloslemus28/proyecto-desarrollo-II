import { useEffect, useRef, useState } from "react";
import { animate, remove } from "animejs";

const TIPOS = [
  { value: "ABONO", label: "Abono" },
  { value: "PAGO_TOTAL", label: "Pago total" },
];

export default function RegisterPaymentModal({
  open,
  onClose,
  caseData,
  onConfirm, // async ({ tipoPago, monto, observacion })
}) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    tipoPago: "ABONO",
    monto: "",
    observacion: "",
  });

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setError("");
    setForm({
      tipoPago: "ABONO",
      monto: "",
      observacion: "",
    });
  }, [open]);

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
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  function close() {
    if (saving) return;
    onClose?.();
  }

  async function handleSave() {
    setError("");

    const monto = Number(form.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError("El monto debe ser mayor que 0.");
      return;
    }

    try {
      setSaving(true);
      await onConfirm?.({
        tipoPago: form.tipoPago,
        monto,
        observacion: form.observacion.trim() || null,
      });
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo registrar el pago.");
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
            <div style={{ fontSize: 16, fontWeight: 800 }}>Registrar pago</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {caseData?.CodigoCaso || "Caso"} • Saldo actual: ${Number(caseData?.Monto || 0).toFixed(2)}
            </div>
          </div>

          <button onClick={close} disabled={saving} style={closeBtn}>
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
            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>Tipo de pago</div>
              <select
                value={form.tipoPago}
                onChange={(e) => setForm({ ...form, tipoPago: e.target.value })}
                disabled={saving}
                style={input}
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>Monto</div>
              <input
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                disabled={saving}
                inputMode="decimal"
                placeholder="Ej: 25.00"
                style={input}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={labelStyle}>Observación</div>
              <textarea
                value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                disabled={saving}
                rows={4}
                placeholder="Detalle del pago..."
                style={{ ...input, resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        <div style={footer}>
          <button onClick={close} disabled={saving} style={softBtn}>
            Cancelar
          </button>

          <button onClick={handleSave} disabled={saving} style={primaryBtn}>
            {saving ? "Guardando..." : "Registrar pago"}
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
  width: 540,
  maxWidth: "92vw",
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
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 12,
  opacity: 0.8,
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