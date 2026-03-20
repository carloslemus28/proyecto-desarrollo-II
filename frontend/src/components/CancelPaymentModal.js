import { useEffect, useState } from "react";

export default function CancelPaymentModal({
  open,
  onClose,
  payment,
  onConfirm,
  loading = false,
}) {
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open) setMotivo("");
  }, [open]);

  if (!open) return null;

  return (
    <div style={overlay} onClick={() => !loading && onClose?.()}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 10 }}>Anular pago</h3>

        <p style={{ marginBottom: 12 }}>
          ¿Deseas anular este pago de <b>${Number(payment?.Monto || 0).toFixed(2)}</b>?
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.8 }}>Motivo de anulación</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            placeholder="Describe el motivo de la anulación..."
            style={input}
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button onClick={onClose} disabled={loading} style={ghostBtn}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm?.(motivo)}
            disabled={loading}
            style={dangerBtn}
          >
            {loading ? "Anulando..." : "Anular pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 99999,
};

const modal = {
  width: "min(520px, 92vw)",
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  padding: 16,
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  resize: "vertical",
};

const ghostBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
};

const dangerBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: "#b91c1c",
  color: "#fff",
  cursor: "pointer",
};