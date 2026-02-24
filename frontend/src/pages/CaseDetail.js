/**
 * Componente CaseDetail - Panel de detalles del caso
 * 
 * Responsabilidades:
 * - Mostrar información completa del caso
 * - Mostrar información del deudor
 * - Mostrar historial de actividades (notas, llamadas)
 * - Agregar nuevas actividades
 * - Gestionar archivos adjuntos (subir, descargar, eliminar)
 * - Integración con WhatsApp
 * - Editar información del caso
 * 
 * Animaciones:
 * - Entrada suave del panel
 * - Animación de archivos y actividades
 * - Transiciones al agregar/eliminar elementos
 * 
 * Uso: Renderizado como panel lado derecho en CasesPage
 */

import { useEffect, useMemo, useRef, useState } from "react";
import CaseMap from "../components/CaseMap";
import { animate, stagger, remove } from "animejs";
import { FaWhatsapp } from "react-icons/fa";
import {
  getCase,
  listActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  getWhatsAppLink,
  listFiles,
  uploadFile,
  deleteFile,
} from "../services/cases.service";
import { useAuth } from "../auth/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../ui/ToastContext";

export default function CaseDetail({ caseId, refreshKey }) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");

  const [c, setC] = useState(null);
  const [activities, setActivities] = useState([]);
  const [files, setFiles] = useState([]);

  const [note, setNote] = useState("");
  const [tipo, setTipo] = useState("NOTA");
  const [file, setFile] = useState(null);
  const [categoria, setCategoria] = useState("EVIDENCIA");
  
  const { showToast } = useToast();

  // Modal eliminar archivo
  const [openDeleteFile, setOpenDeleteFile] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal cambiar estado
  const [openActMenuId, setOpenActMenuId] = useState(null);

  // Modal editar actividad
  const [openEditAct, setOpenEditAct] = useState(false);
  const [editingAct, setEditingAct] = useState(null);
  const [editTipo, setEditTipo] = useState("NOTA");
  const [editNota, setEditNota] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal eliminar actividad
  const [openDeleteAct, setOpenDeleteAct] = useState(false);
  const [actToDelete, setActToDelete] = useState(null);
  const [deletingAct, setDeletingAct] = useState(false);

  // Referencias para animaciones
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const mapWrapRef = useRef(null);
  const activitiesCardRef = useRef(null);
  const filesCardRef = useRef(null);

  const btnWhatsRef = useRef(null);
  const btnAddActRef = useRef(null);
  const btnUploadRef = useRef(null);

  // Referencias para filas de actividades y archivos
  const fileRowRefs = useRef(new Map());
  const actRowRefs = useRef(new Map());

  function setFileRowRef(id, el) {
    if (!id) return;
    if (el) fileRowRefs.current.set(id, el);
    else fileRowRefs.current.delete(id);
  }
  function setActRowRef(id, el) {
    if (!id) return;
    if (el) actRowRefs.current.set(id, el);
    else actRowRefs.current.delete(id);
  }

  async function load() {
    const r1 = await getCase(caseId);
    setC(r1.case);

    const r2 = await listActivities(caseId);
    setActivities(r2.activities || []);

    const r3 = await listFiles(caseId);
    setFiles(r3.files || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refreshKey]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    remove(root);

    root.style.opacity = "0";
    root.style.transform = "translateY(10px)";

    animate(
      root,
      { opacity: [0, 1], translateY: [10, 0] },
      { duration: 260, easing: "easeOutQuad" }
    );

    const sections = [
      headerRef.current,
      mapWrapRef.current,
      activitiesCardRef.current,
      filesCardRef.current,
    ].filter(Boolean);

    remove(sections);

    animate(
      sections,
      { opacity: [0, 1], translateY: [10, 0] },
      { delay: stagger(70), duration: 300, easing: "easeOutQuad" }
    );
  }, [caseId, refreshKey]);

  function pressAnim(ref) {
    const el = ref?.current;
    if (!el) return;
    remove(el);
    animate(el, { scale: [1, 0.97, 1] }, { duration: 180, easing: "easeOutQuad" });
  }

  function hoverAnimIn(ref) {
    const el = ref?.current;
    if (!el) return;
    remove(el);
    animate(el, { scale: 1.02 }, { duration: 160, easing: "easeOutQuad" });
  }

  function hoverAnimOut(ref) {
    const el = ref?.current;
    if (!el) return;
    remove(el);
    animate(el, { scale: 1 }, { duration: 160, easing: "easeOutQuad" });
  }

  async function handleAddActivity() {
    if (!note.trim()) return;

    pressAnim(btnAddActRef);

    await addActivity(caseId, { tipo, nota: note });
    setNote("");

    const r2 = await listActivities(caseId);
    const newActs = r2.activities || [];
    setActivities(newActs);

    const first = newActs[0];
    if (first?.ActividadId) {
      const el = actRowRefs.current.get(first.ActividadId);
      if (el) {
        remove(el);
        animate(
          el,
          { backgroundColor: ["#ffffff", "#eef2ff", "#ffffff"] },
          { duration: 900, easing: "easeOutQuad" }
        );
      }
    }

    showToast("Actividad registrada", "success", 5000);
  }
// Función para manejar clic en botón de WhatsApp
  async function handleWhatsApp() {
    pressAnim(btnWhatsRef);
    const r = await getWhatsAppLink(caseId);
    window.open(r.url, "_blank");
  }
// Funciones para manejar enlaces de ubicación
  function getMapsLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
// Función para obtener enlace de direcciones en Google Maps
function getDirectionsLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
// Función para manejar Cómo llegar - abre Google Maps con direcciones
async function handleDirections() {
  const url = getDirectionsLink(c?.Lat, c?.Lng);
  if (!url) {
    showToast("Este caso no tiene ubicación registrada.", "warning", 5000);
    return;
  }
  window.open(url, "_blank");
}
// Función para manejar Compartir ubicación
async function handleShareLocation() {
  const url = getMapsLink(c?.Lat, c?.Lng);
  if (!url) {
    showToast("Este caso no tiene ubicación registrada.", "warning", 5000);
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Ubicación - ${c?.CodigoCaso || "Caso"}`,
        text: `${c?.Nombres || ""} ${c?.Apellidos || ""}`.trim(),
        url,
      });
      showToast("Ubicación compartida", "success", 4000);
      return;
    } catch (_) {
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast("Enlace copiado al portapapeles", "success", 5000);
  } catch (e) {
    // 
    showToast("No se pudo copiar. Se abrirá el enlace para copiarlo.", "warning", 6000);
    window.open(url, "_blank");
  }
}

  async function handleUpload() {
    if (!file) return;

    pressAnim(btnUploadRef);

    try {
      await uploadFile(caseId, file, categoria);
      setFile(null);

      const r = await listFiles(caseId);
      const newFiles = r.files || [];
      setFiles(newFiles);

      const first = newFiles[0];
      if (first?.ArchivoId) {
        const el = fileRowRefs.current.get(first.ArchivoId);
        if (el) {
          remove(el);
          animate(el, { opacity: [0, 1], translateY: [8, 0] }, { duration: 260, easing: "easeOutQuad" });
        }
      }

      showToast("Archivo subido correctamente", "success", 5000);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo subir el archivo", "error", 5000);
    }
  }
// Función para iniciar proceso de eliminación de archivo
  function askDeleteFile(f) {
    setFileToDelete(f);
    setOpenDeleteFile(true);
  }
// Función para confirmar eliminación de archivo
  async function confirmDeleteFile() {
    if (!fileToDelete) return;

    try {
      setDeleting(true);

      const el = fileRowRefs.current.get(fileToDelete.ArchivoId);
      if (el) {
        remove(el);
        const anim = animate(el, { opacity: [1, 0], translateX: [0, 10] }, { duration: 180, easing: "easeInQuad" });
        if (anim?.finished) await anim.finished;
      }

      await deleteFile(caseId, fileToDelete.ArchivoId);

      const r = await listFiles(caseId);
      setFiles(r.files || []);

      showToast("Archivo eliminado correctamente", "success", 5000);
      setOpenDeleteFile(false);
      setFileToDelete(null);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo eliminar el archivo", "error", 5000);
    } finally {
      setDeleting(false);
    }
  }

  // Permisos para editar/eliminar actividad: dueño o ADMIN
  function canManageActivity(a) {
    if (isAdmin) return true;
    // requiere que el backend mande UsuarioId
    return Number(a?.UsuarioId) === Number(user?.usuarioId);
  }

  function openEditActivity(a) {
    setOpenActMenuId(null);
    setEditingAct(a);
    setEditTipo(a.Tipo || "NOTA");
    setEditNota(a.Nota || "");
    setOpenEditAct(true);
  }

  function askDeleteActivity(a) {
    setOpenActMenuId(null);
    setActToDelete(a);
    setOpenDeleteAct(true);
  }

async function confirmDeleteActivity() {
  if (!actToDelete) return;

  try {
    setDeletingAct(true);

    // Animación salida
    const el = actRowRefs.current.get(actToDelete.ActividadId);
    if (el) {
      remove(el);

      const cs = getComputedStyle(el);
      const anim = animate(
        el,
        {
          opacity: [1, 0],
          translateX: [0, 10],
          height: [el.offsetHeight, 0],
          marginTop: [parseFloat(cs.marginTop) || 0, 0],
          marginBottom: [parseFloat(cs.marginBottom) || 0, 0],
          paddingTop: [parseFloat(cs.paddingTop) || 0, 0],
          paddingBottom: [parseFloat(cs.paddingBottom) || 0, 0],
        },
        { duration: 220, easing: "easeInQuad" }
      );

      if (anim?.finished) await anim.finished;
    }

    await deleteActivity(actToDelete.ActividadId);

    const r2 = await listActivities(caseId);
    setActivities(r2.activities || []);

    showToast("Actividad eliminada", "success", 5000);
  } catch (e) {
    const msg = e?.response?.data?.message || "No se pudo eliminar la actividad";
    showToast(msg, "error", 5000);

    // Recarga actividades para “reponer” si la animación corrió pero backend rechazó
    const r2 = await listActivities(caseId);
    setActivities(r2.activities || []);
  } finally {
    setDeletingAct(false);
    setOpenDeleteAct(false);
    setActToDelete(null);
  }
}

  async function saveEditActivity() {
    if (!editingAct) return;
    if (!editNota.trim()) {
      showToast("La nota no puede ir vacía.", "warning", 5000);
      return;
    }

    try {
      setSavingEdit(true);

      await updateActivity(editingAct.ActividadId, { tipo: editTipo, nota: editNota });

      const r2 = await listActivities(caseId);
      setActivities(r2.activities || []);
      const el = actRowRefs.current.get(editingAct.ActividadId);
      if (el) {
        remove(el);
        animate(
          el,
          { backgroundColor: ["#ffffff", "#fff7ed", "#ffffff"] },
          { duration: 900, easing: "easeOutQuad" }
        );
      }

      showToast("Actividad actualizada", "success", 5000);
      setOpenEditAct(false);
      setEditingAct(null);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo actualizar la actividad", "error", 5000);
    } finally {
      setSavingEdit(false);
    }
  }

  const fileBaseUrl = useMemo(() => "http://localhost:4000", []);

  if (!c) {
    return <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>Cargando...</div>;
  }

  return (
    <>
      <div ref={rootRef} style={{ display: "grid", gap: 12 }} onClick={() => setOpenActMenuId(null)}>
        {/* Header */}
        <div ref={headerRef} style={{ background: "#fff", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div>
              <h2 style={{ marginBottom: 6 }}>{c.CodigoCaso}</h2>
              <div style={{ opacity: 0.85 }}>
                <b>
                  {c.Nombres} {c.Apellidos}
                </b>{" "}
                • {c.Telefono || "Sin teléfono"} • {c.Direccion || "Sin dirección"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                Estado: <b>{c.EstadoNombre}</b> • Monto: <b>${c.Monto}</b>
              </div>
            </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleDirections}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 700,
                  }}
                  title="Abrir ruta en Google Maps"
                >
                  Cómo llegar
                </button>

                <button
                  onClick={handleShareLocation}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 700,
                  }}
                  title="Copiar o compartir enlace de ubicación"
                >
                  Compartir ubicación
                </button>

                <button
                  ref={btnWhatsRef}
                  onClick={handleWhatsApp}
                  onMouseEnter={() => hoverAnimIn(btnWhatsRef)}
                  onMouseLeave={() => hoverAnimOut(btnWhatsRef)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: "#22c55e",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                  }}
                  title="Abrir WhatsApp"
                >
                  <FaWhatsapp size={18} />
                  WhatsApp
                </button>
              </div>
          </div>
        </div>

        {/* Mapa */}
        <div ref={mapWrapRef}>
          <CaseMap lat={c.Lat} lng={c.Lng} label={`${c.Nombres} ${c.Apellidos}`} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Actividades */}
          <div ref={activitiesCardRef} style={{ background: "#fff", borderRadius: 12, padding: 14 }}>
            <h3>Seguimiento / Actividades</h3>

            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
                <option value="NOTA">NOTA</option>
                <option value="LLAMADA">LLAMADA</option>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="VISITA">VISITA</option>
                <option value="EMAIL">EMAIL</option>
              </select>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Escribe una nota..."
                rows={3}
                style={{ padding: 10, borderRadius: 8 }}
              />

              <button
                ref={btnAddActRef}
                onClick={handleAddActivity}
                onMouseEnter={() => hoverAnimIn(btnAddActRef)}
                onMouseLeave={() => hoverAnimOut(btnAddActRef)}
                style={{ padding: 10, borderRadius: 10, border: "none", cursor: "pointer" }}
              >
                Agregar actividad
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {activities.map((a) => {
                const canManage = canManageActivity(a);

                return (
                  <div
                    key={a.ActividadId}
                    ref={(el) => setActRowRef(a.ActividadId, el)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      position: "relative",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "grid", gap: 3 }}>
                        <b>{a.Tipo}</b>
                        <span style={{ fontSize: 12, opacity: 0.75 }}>{new Date(a.CreadoEn).toLocaleString()}</span>
                      </div>

                      {/*solo si puede gestionar */}
                      {canManage ? (
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() =>
                              setOpenActMenuId(openActMenuId === a.ActividadId ? null : a.ActividadId)
                            }
                            style={dotsBtn}
                            title="Opciones"
                          >
                            ⋯
                          </button>

                          {openActMenuId === a.ActividadId && (
                            <div style={menuBox}>
                              <MenuItem
                                label="Editar"
                                onClick={() => openEditActivity(a)}
                              />
                              <MenuItem
                                label="Eliminar"
                                danger
                                onClick={() => askDeleteActivity(a)}
                              />
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>{a.Nota}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Por: {a.UsuarioNombre}</div>
                  </div>
                );
              })}

              {activities.length === 0 ? <p>No hay actividades.</p> : null}
            </div>
          </div>

          {/* Archivos */}
          <div ref={filesCardRef} style={{ background: "#fff", borderRadius: 12, padding: 14 }}>
            <h3>Archivos del caso</h3>

            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Categoría (CONTRATO, EVIDENCIA...)"
                style={{ padding: 10, borderRadius: 8 }}
              />
              <button
                ref={btnUploadRef}
                onClick={handleUpload}
                onMouseEnter={() => hoverAnimIn(btnUploadRef)}
                onMouseLeave={() => hoverAnimOut(btnUploadRef)}
                style={{ padding: 10, borderRadius: 10, border: "none", cursor: "pointer" }}
              >
                Subir archivo
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {files.map((f) => (
                <div
                  key={f.ArchivoId}
                  ref={(el) => setFileRowRef(f.ArchivoId, el)}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    background: "#fff",
                  }}
                >
                  <a
                    href={`${fileBaseUrl}${f.Ruta}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "block", textDecoration: "none", flex: 1, color: "inherit" }}
                  >
                    <b>{f.Categoria || "ARCHIVO"}</b>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>{f.NombreOriginal}</div>
                  </a>

                  {isAdmin && (
                    <button
                      onClick={() => askDeleteFile(f)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                      title="Eliminar archivo"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
              {files.length === 0 ? <p>No hay archivos.</p> : null}
            </div>
          </div>
        </div>
      </div>

      {/*Modal confirmación Eliminar Archivo */}
      <ConfirmModal
        open={openDeleteFile}
        title="Eliminar archivo"
        message={
          fileToDelete
            ? `¿Deseas eliminar "${fileToDelete.NombreOriginal}"? Esta acción no se puede deshacer.`
            : "¿Deseas eliminar este archivo?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setOpenDeleteFile(false);
          setFileToDelete(null);
        }}
        onConfirm={confirmDeleteFile}
      />

      {/*Modal confirmación Eliminar Actividad */}
      <ConfirmModal
        open={openDeleteAct}
        title="Eliminar actividad"
        message={
          actToDelete
            ? `¿Deseas eliminar esta actividad? Esta acción no se puede deshacer.`
            : "¿Deseas eliminar esta actividad?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={deletingAct}
        onClose={() => {
          if (deletingAct) return;
          setOpenDeleteAct(false);
          setActToDelete(null);
        }}
        onConfirm={confirmDeleteActivity}
      />

      {/*Modal simple Editar Actividad (mínimo y consistente) */}
      {openEditAct ? (
        <div style={overlay} onClick={() => (savingEdit ? null : setOpenEditAct(false))}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Editar actividad</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)} style={input}>
                <option value="NOTA">NOTA</option>
                <option value="LLAMADA">LLAMADA</option>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="VISITA">VISITA</option>
                <option value="EMAIL">EMAIL</option>
              </select>

              <textarea
                value={editNota}
                onChange={(e) => setEditNota(e.target.value)}
                rows={4}
                style={{ ...input, resize: "vertical" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => setOpenEditAct(false)}
                  disabled={savingEdit}
                  style={btnGhost}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditActivity}
                  disabled={savingEdit}
                  style={btnPrimary}
                >
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuItem({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        border: "none",
        background: "#fff",
        cursor: "pointer",
        color: danger ? "#b91c1c" : "#111827",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
    >
      {label}
    </button>
  );
}

const dotsBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  lineHeight: 1,
};

const menuBox = {
  position: "absolute",
  right: 0,
  top: 34,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
  overflow: "hidden",
  zIndex: 50,
  minWidth: 170,
};

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
  padding: 14,
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const btnPrimary = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
};
