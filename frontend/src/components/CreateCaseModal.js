/**
 * Componente CreateCaseModal - Modal para crear nuevo caso
 * 
 * Responsabilidades:
 * - Formulario de creación de caso
 * - Capturar datos del deudor (nombres, apellidos, teléfono, etc.)
 * - Capturar datos iniciales del caso (monto, descripción)
 * - Mostrar mapa interactivo para ubicación
 * - Validar datos requeridos
 * - Llamar API para crear caso
 * 
 * Props:
 * - isOpen: mostrar u ocultar modal
 * - onClose: callback al cerrar
 * - onSuccess: callback tras crear exitosamente
 */

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { createCase } from "../services/cases.service";
import { animate, remove, stagger } from "animejs";
import CaseMap from "../components/CaseMap";

async function geocodeAddress(q) {
  // Usamos Nominatim de OpenStreetMap para geocodificar la dirección
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=` +
    encodeURIComponent(q);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("No se pudo definir la dirección");
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}
// Componente principal
export default function CreateCaseModal({ open, onClose, onCreated }) {
  const [mounted, setMounted] = useState(false);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const btnCloseRef = useRef(null);
  const btnCancelRef = useRef(null);
  const btnCreateRef = useRef(null);

  const fieldsWrapRef = useRef(null);

  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    telefono: "",
    direccion: "",
    lat: "",
    lng: "",
    monto: "",
    descripcion: "",
    estadoCodigo: "NUEVO",
    asignadoAUsuarioId: "",
  });

  const canSave = useMemo(() => {
    return form.nombres.trim() && form.apellidos.trim() && !saving;
  }, [form.nombres, form.apellidos, saving]);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setError("");
    setSaving(false);
    setGeoLoading(false);
    setGeoMsg("");

    (async () => {
      try {
        const { data } = await api.get("/users");
        setAgents((data.users || []).filter((u) => u.Activo === 1));
      } catch (e) {
        setAgents([]);
      }
    })();
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
      modalEl.style.transform = "translateY(14px) scale(0.985)";

      animate(overlayEl, {
        opacity: [0, 1],
        duration: 180,
        easing: "easeOutQuad",
      });

      const a = animate(modalEl, {
        opacity: [0, 1],
        translateY: [14, 0],
        scale: [0.985, 1],
        duration: 230,
        easing: "easeOutQuad",
      });

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

      (anim?.finished ? anim.finished : Promise.resolve()).then(() => setMounted(false));
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

  function close() {
    if (saving) return;
    onClose?.();
  }

  async function geocodeNow() {
    if (saving) return;

    const q = (form.direccion || "").trim();
    setGeoMsg("");

    if (!q) {
      setForm((p) => ({ ...p, lat: "", lng: "" }));
      return;
    }

    if (q.length < 6) {
      setForm((p) => ({ ...p, lat: "", lng: "" }));
      setGeoMsg("Escribe una dirección más específica.");
      return;
    }

    try {
      setGeoLoading(true);
      const r = await geocodeAddress(q);

      if (!r) {
        setForm((p) => ({ ...p, lat: "", lng: "" }));
        setGeoMsg("No se encontró esa dirección. Agrega ciudad/país.");
        return;
      }

      setForm((p) => ({ ...p, lat: r.lat, lng: r.lng }));
      setGeoMsg("Ubicación encontrada!");
    } catch (e) {
      setForm((p) => ({ ...p, lat: "", lng: "" }));
      setGeoMsg(e?.message || "No se pudo definir la dirección.");
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleCreate() {
    setError("");

    if (!form.nombres.trim() || !form.apellidos.trim()) {
      setError("Nombres y apellidos son requeridos.");
      return;
    }

    pressAnim(btnCreateRef);

    try {
      setSaving(true);

      await createCase({
        deudor: {
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim() || null,
          direccion: form.direccion.trim() || null,
          lat: form.lat === "" ? null : Number(form.lat),
          lng: form.lng === "" ? null : Number(form.lng),
        },
        caso: {
          monto: form.monto === "" ? 0 : Number(form.monto),
          descripcion: form.descripcion.trim() || null,
          estadoCodigo: form.estadoCodigo,
          asignadoAUsuarioId: form.asignadoAUsuarioId ? Number(form.asignadoAUsuarioId) : null,
        },
      });

      setForm({
        nombres: "",
        apellidos: "",
        telefono: "",
        direccion: "",
        lat: "",
        lng: "",
        monto: "",
        descripcion: "",
        estadoCodigo: "NUEVO",
        asignadoAUsuarioId: "",
      });

      setGeoMsg("");
      onCreated?.();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo crear el caso.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  const debtorLabel = `${form.nombres} ${form.apellidos}`.trim() || "Deudor";

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
            <div style={{ fontSize: 16, fontWeight: 800 }}>Crear Caso</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Registrar deudor y abrir caso de cobranza
            </div>
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
          {error && (
            <div style={errorBox}>
              <b>Error:</b> {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Section title="Datos del deudor">
              <Field label="Nombres *">
                <input
                  data-anim="field"
                  value={form.nombres}
                  onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  placeholder="Ej: Juan"
                  style={inputStyle}
                />
              </Field>

              <Field label="Apellidos *">
                <input
                  data-anim="field"
                  value={form.apellidos}
                  onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  placeholder="Ej: Pérez"
                  style={inputStyle}
                />
              </Field>

              <Field label="Teléfono">
                <input
                  data-anim="field"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej: 7890-1234"
                  style={inputStyle}
                />
              </Field>

              <Field label="Dirección">
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                  <input
                    data-anim="field"
                    value={form.direccion}
                    onChange={(e) => {
                      setForm({ ...form, direccion: e.target.value, lat: "", lng: "" });
                      setGeoMsg("");
                    }}
                    onBlur={geocodeNow}
                    placeholder="Ej: Sonsonate, El Salvador"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={geocodeNow}
                    disabled={geoLoading || saving}
                    style={{
                      ...softBtn,
                      whiteSpace: "nowrap",
                      opacity: geoLoading ? 0.7 : 1,
                      cursor: geoLoading || saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {geoLoading ? "Buscando..." : "Actualizar ubicación"}
                  </button>
                </div>

                {geoMsg ? (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{geoMsg}</div>
                ) : null}

                <div style={{ marginTop: 10 }}>
                  <CaseMap lat={form.lat} lng={form.lng} label={debtorLabel} />
                </div>
              </Field>
            </Section>

            <Section title="Datos del caso">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Monto">
                  <input
                    data-anim="field"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="Ej: 250.75"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Estado">
                  <select
                    data-anim="field"
                    value={form.estadoCodigo}
                    onChange={(e) => setForm({ ...form, estadoCodigo: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="NUEVO">Nuevo</option>
                    <option value="EN_GESTION">En gestión</option>
                    <option value="PROMESA_PAGO">Promesa de pago</option>
                    <option value="INCUMPLIDO">Incumplido</option>
                    <option value="CERRADO">Cerrado</option>
                  </select>
                </Field>
              </div>

              <Field label="Descripción">
                <textarea
                  data-anim="field"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalle del caso..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>

              <Field label="Asignar a">
                <select
                  data-anim="field"
                  value={form.asignadoAUsuarioId}
                  onChange={(e) => setForm({ ...form, asignadoAUsuarioId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Sin asignar</option>
                  {agents.map((a) => (
                    <option key={a.UsuarioId} value={a.UsuarioId}>
                      {a.Nombre} ({a.Email})
                    </option>
                  ))}
                </select>
              </Field>

              <div style={hintBox}>
                Al crear el caso, se generará un código tipo <b>CASO-000001</b>.
              </div>
            </Section>
          </div>
        </div>

        <div style={footer}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>* Campos obligatorios</div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              ref={btnCancelRef}
              onClick={() => {
                pressAnim(btnCancelRef);
                close();
              }}
              disabled={saving}
              style={{
                ...softBtn,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
              onMouseEnter={() => hoverIn(btnCancelRef)}
              onMouseLeave={() => hoverOut(btnCancelRef)}
            >
              Cancelar
            </button>

            <button
              ref={btnCreateRef}
              onClick={handleCreate}
              disabled={!canSave}
              style={{
                ...primaryBtn,
                cursor: !canSave ? "not-allowed" : "pointer",
                opacity: !canSave ? 0.7 : 1,
              }}
              onMouseEnter={() => hoverIn(btnCreateRef)}
              onMouseLeave={() => hoverOut(btnCreateRef)}
            >
              {saving ? "Creando..." : "Crear caso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- UI helpers -------- */

function Section({ title, children }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
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

/* -------- styles -------- */

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
  width: 820,
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
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  background: "#fff",
};

const inputStyle = {
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

const errorBox = {
  background: "#ffe6e6",
  border: "1px solid #ffc2c2",
  padding: 10,
  borderRadius: 12,
  marginBottom: 12,
};

const hintBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  fontSize: 12,
  opacity: 0.85,
};
