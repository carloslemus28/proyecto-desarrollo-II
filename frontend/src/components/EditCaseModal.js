/**
 * Componente EditCaseModal - Modal para editar caso existente
 * 
 * Responsabilidades:
 * - Formulario pre-llenado con datos del caso
 * - Editar información del caso (monto, descripción)
 * - Editar información del deudor
 * - Mostrar/actualizar ubicación en mapa
 * - Validar cambios
 * - Llamar API para actualizar
 * 
 * Props:
 * - caseId: ID del caso a editar
 * - isOpen: mostrar u ocultar modal
 * - onClose: callback al cerrar
 * - onSuccess: callback tras actualizar exitosamente
 */

import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { updateCase, updateDebtor } from "../services/cases.service";
import { animate, remove, stagger } from "animejs";
import CaseMap from "../components/CaseMap";

async function geocodeAddress(q) {
  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2" +
    "&limit=5" +
    "&addressdetails=1" +
    "&countrycodes=sv" +
    "&bounded=1" +
    "&viewbox=-90.15,14.45,-87.70,13.10" + 
    "&q=" + encodeURIComponent(q);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es",
    },
  });

  if (!res.ok) throw new Error("No se pudo geocodificar la dirección");
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

export default function EditCaseModal({ open, onClose, caseData, caseId, onSaved }) {
  const [mounted, setMounted] = useState(false);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const btnCloseRef = useRef(null);
  const btnCancelRef = useRef(null);
  const btnSaveRef = useRef(null);

  const fieldsWrapRef = useRef(null);

  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  const [edit, setEdit] = useState({
    monto: "",
    descripcion: "",
    asignadoAUsuarioId: "",
    telefono: "",
    direccion: "",
    lat: "",
    lng: "",
  });

  // Montaje para permitir salida
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Cargar datos al abrir
  useEffect(() => {
    if (!open) return;

    setError("");
    setSaving(false);
    setGeoLoading(false);
    setGeoMsg("");

    if (caseData) {
      setEdit({
        monto: caseData.Monto ?? "",
        descripcion: caseData.Descripcion ?? "",
        asignadoAUsuarioId: caseData.AsignadoAUsuarioId ?? "",
        telefono: caseData.Telefono ?? "",
        direccion: caseData.Direccion ?? "",
        lat: caseData.Lat ?? "",
        lng: caseData.Lng ?? "",
      });
    }

    (async () => {
      try {
        const { data } = await api.get("/users");
        setAgents((data.users || []).filter((u) => u.Activo === 1));
      } catch (e) {
        setAgents([]);
      }
    })();
  }, [open, caseData]);

  // Animación entrada/salida
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
          delay: stagger(30),
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

  // Cerrar con ESC
  useEffect(() => {
    if (!open || saving) return;

    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saving]);

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

    const q = (edit.direccion || "").trim();
    setGeoMsg("");

    // si borra dirección, borra coords
    if (!q) {
      setEdit((p) => ({ ...p, lat: "", lng: "" }));
      return;
    }

    // evita resultados basura
    if (q.length < 6) {
      setEdit((p) => ({ ...p, lat: "", lng: "" }));
      setGeoMsg("Escribe una dirección más específica.");
      return;
    }

    try {
      setGeoLoading(true);
      const r = await geocodeAddress(q);

      if (!r) {
        setEdit((p) => ({ ...p, lat: "", lng: "" }));
        setGeoMsg("No se encontró esa dirección. Prueba agregando ciudad/país.");
        return;
      }

      setEdit((p) => ({ ...p, lat: r.lat, lng: r.lng }));
      setGeoMsg("Ubicación actualizada ✅");
    } catch (e) {
      setEdit((p) => ({ ...p, lat: "", lng: "" }));
      setGeoMsg(e?.message || "No se pudo geocodificar la dirección.");
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleSave() {
    setError("");
    pressAnim(btnSaveRef);

    try {
      setSaving(true);

      await updateCase(caseId, {
        monto: edit.monto === "" ? 0 : Number(edit.monto),
        descripcion: edit.descripcion,
        asignadoAUsuarioId: edit.asignadoAUsuarioId ? Number(edit.asignadoAUsuarioId) : null,
      });

      await updateDebtor(caseId, {
        telefono: edit.telefono,
        direccion: edit.direccion,
        lat: edit.lat === "" ? null : Number(edit.lat),
        lng: edit.lng === "" ? null : Number(edit.lng),
      });

      if (onSaved) await onSaved();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  const debtorLabel = `${caseData?.Nombres || ""} ${caseData?.Apellidos || ""}`.trim() || "Deudor";

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
            <div style={{ fontSize: 16, fontWeight: 800 }}>Editar Caso</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {caseData?.CodigoCaso || `Caso #${caseId}`}
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
            <Section title="Caso">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Monto">
                  <input
                    data-anim="field"
                    value={edit.monto}
                    onChange={(e) => setEdit({ ...edit, monto: e.target.value })}
                    style={input}
                  />
                </Field>

                {/*Estado eliminado del modal */}
              </div>

              <Field label="Descripción">
                <input
                  data-anim="field"
                  value={edit.descripcion}
                  onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })}
                  style={input}
                />
              </Field>

              <Field label="Asignar a">
                <select
                  data-anim="field"
                  value={edit.asignadoAUsuarioId}
                  onChange={(e) => setEdit({ ...edit, asignadoAUsuarioId: e.target.value })}
                  style={input}
                >
                  <option value="">Sin asignar</option>
                  {agents.map((a) => (
                    <option key={a.UsuarioId} value={a.UsuarioId}>
                      {a.Nombre} ({a.Email})
                    </option>
                  ))}
                </select>
              </Field>
            </Section>

            <Section title="Deudor">
              <Field label="Teléfono">
                <input
                  data-anim="field"
                  value={edit.telefono}
                  onChange={(e) => setEdit({ ...edit, telefono: e.target.value })}
                  style={input}
                />
              </Field>

              {/*Dirección + botón de geocodificación */}
              <Field label="Dirección">
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                  <input
                    data-anim="field"
                    value={edit.direccion}
                    onChange={(e) => {
                      setEdit({ ...edit, direccion: e.target.value, lat: "", lng: "" });
                      setGeoMsg("");
                    }}
                    onBlur={geocodeNow}
                    style={input}
                    placeholder="Ej: Sonsonate, El Salvador"
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
                  <CaseMap lat={edit.lat} lng={edit.lng} label={debtorLabel} />
                </div>

                {/* lat/lng ocultos para el usuario */}
                <div style={{ display: "none" }}>
                  {String(edit.lat)} {String(edit.lng)}
                </div>
              </Field>
            </Section>
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
            style={{
              ...softBtn,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
            onMouseEnter={() => hoverIn(btnCancelRef)}
            onMouseLeave={() => hoverOut(btnCancelRef)}
          >
            Cancelar
          </button>

          <button
            ref={btnSaveRef}
            onClick={handleSave}
            disabled={saving}
            style={{
              ...primaryBtn,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
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

/* ----- styles ----- */

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
  width: 860,
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
