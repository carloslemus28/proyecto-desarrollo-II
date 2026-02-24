/**
 * Página de Casos - Gestión completa de casos de cobranza
 * 
 * Responsabilidades:
 * - Listar casos con paginación y filtros
 * - Buscar casos por término
 * - Crear nuevos casos
 * - Editar información de casos
 * - Cambiar estado del caso
 * - Ver detalle de caso (panel derecho)
 * - Eliminar casos
 * - Íconos de acción por fila (menú 3 puntos)
 * 
 * Componentes anidados:
 * - CaseDetail: Panel de detalles
 * - CreateCaseModal: Modal para crear
 * - EditCaseModal: Modal para editar
 * - ChangeStatusModal: Modal cambio de estado
 * - ConfirmModal: Confirmación de eliminación
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { listCases, deleteCase, changeCaseStatus } from "../services/cases.service";
import CaseDetail from "./CaseDetail";
import { useAuth } from "../auth/AuthContext";
import CreateCaseModal from "../components/CreateCaseModal";
import EditCaseModal from "../components/EditCaseModal";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../ui/ToastContext";
import ChangeStatusModal from "../components/ChangeStatusModal";

const ESTADOS = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "EN_GESTION", label: "En gestión" },
  { value: "PROMESA_PAGO", label: "Promesa de pago" },
  { value: "INCUMPLIDO", label: "Incumplido" },
  { value: "CERRADO", label: "Cerrar caso" },
];

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openStatus, setOpenStatus] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null)
  // refresh del detalle al guardar desde modal
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  // menú 3 puntos + modal editar
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  //Modal eliminar caso
  const [openDeleteCase, setOpenDeleteCase] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  //Modal cambiar estado
  const [openChangeStatus, setOpenChangeStatus] = useState(false);
  const [caseToChangeStatus, setCaseToChangeStatus] = useState(null);
  const [newEstado, setNewEstado] = useState("NUEVO");
  const [savingStatus, setSavingStatus] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");
  const [openCreate, setOpenCreate] = useState(false);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");

  const { showToast } = useToast();

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
// función para cargar casos 
  const load = useCallback(async ({ selectLast = false } = {}) => {
    setLoading(true);
    try {
      const r = await listCases();
      const arr = r.cases || [];
      setCases(arr);

      if (selectLast && arr.length > 0) {
        setSelected(arr[0].CasoId);
      } else {
        if (selectedRef.current && !arr.some((x) => x.CasoId === selectedRef.current)) {
          setSelected(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    function handleKey(e) {
      if (e.key === "Escape") {
        setSelected(null);
        setOpenMenuId(null);
        setOpenChangeStatus(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [load]);
// función para filtrar casos según búsqueda y estado
  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const text = `${c.CodigoCaso} ${c.Nombres} ${c.Apellidos} ${c.EstadoCodigo} ${c.EstadoNombre}`.toLowerCase();
      const okQ = q.trim() ? text.includes(q.trim().toLowerCase()) : true;
      const okEstado = estado ? c.EstadoCodigo === estado : true;
      return okQ && okEstado;
    });
  }, [cases, q, estado]);
// función para manejar solicitud de eliminación de caso
  function askDeleteCase(c) {
    setCaseToDelete(c);
    setOpenDeleteCase(true);
    setOpenMenuId(null);
  }
// función para manejar confirmación de eliminación de caso
  async function confirmDeleteCase() {
    if (!caseToDelete) return;

    try {
      setDeleting(true);
      await deleteCase(caseToDelete.CasoId);

      if (selected === caseToDelete.CasoId) setSelected(null);

      await load();
      showToast("Caso eliminado correctamente", "success", 5000);

      setOpenDeleteCase(false);
      setCaseToDelete(null);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo eliminar el caso", "error", 5000);
    } finally {
      setDeleting(false);
    }
  }

  async function confirmChangeStatus() {
    if (!caseToChangeStatus) return;

    try {
      setSavingStatus(true);
      await changeCaseStatus(caseToChangeStatus.CasoId, newEstado);

      await load();
      setDetailRefreshKey((k) => k + 1);

      showToast("Estado actualizado", "success", 5000);
      setOpenChangeStatus(false);
      setCaseToChangeStatus(null);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo cambiar el estado", "error", 5000);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
        {/* Panel izquierdo */}
        <div
          style={{ background: "#fff", borderRadius: 12, padding: 12 }}
          onClick={() => setOpenMenuId(null)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <h2>Casos</h2>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenCreate(true);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Crear Caso
              </button>
            )}
          </div>

          {/* Buscador y filtro */}
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código, nombre, apellido..."
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />

            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            >
              <option value="">Todos los estados</option>
              <option value="NUEVO">Nuevo</option>
              <option value="EN_GESTION">En gestión</option>
              <option value="PROMESA_PAGO">Promesa de pago</option>
              <option value="INCUMPLIDO">Incumplido</option>
              <option value="CERRADO">Cerrado</option>
            </select>
          </div>

          {loading ? <p>Cargando...</p> : null}

          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map((c) => (
              <div
                key={c.CasoId}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(c.CasoId);
                  setOpenMenuId(null);
                }}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: selected === c.CasoId ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <b>{c.CodigoCaso}</b>
                      <span style={{ fontSize: 12 }}>{c.EstadoNombre}</span>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      {c.Nombres} {c.Apellidos} • ${c.Monto}
                    </div>
                  </div>

                  {/* Menú 3 puntos SOLO ADMIN */}
                  {isAdmin && (
                    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === c.CasoId ? null : c.CasoId)}
                        style={{
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          borderRadius: 10,
                          padding: "6px 10px",
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                        title="Opciones"
                      >
                        ⋯
                      </button>

                      {openMenuId === c.CasoId && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 40,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                            zIndex: 50,
                            minWidth: 170,
                          }}
                        >
                          <MenuItem
                            label="Editar"
                            onClick={() => {
                              setEditTarget(c);
                              setOpenEdit(true);
                              setOpenMenuId(null);
                            }}
                          />

                          <MenuItem
                            label="Cambiar estado"
                            onClick={() => {
                              setStatusTarget(c);
                              setOpenStatus(true);
                              setOpenMenuId(null);
                            }}
                          />

                          <MenuItem
                            label="Eliminar"
                            danger
                            onClick={() => askDeleteCase(c)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 ? <p>No hay casos con esos filtros.</p> : null}
          </div>
        </div>

        {/* Panel derecho */}
        <div
          onClick={() => {
            if (selected) {
              setSelected(null);
              setOpenMenuId(null);
            }
          }}
          style={{ position: "relative" }}
        >
          {selected ? (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ height: "100%" }}
            >
              <CaseDetail caseId={selected} refreshKey={detailRefreshKey} />
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
              <h3>Seleccione un caso</h3>
              <p>Para ver más detalles.</p>
            </div>
          )}
        </div>

        {/* Modal crear caso */}
        <CreateCaseModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={async () => {
            await load({ selectLast: true });
            showToast("Caso creado correctamente", "success", 5000);
          }}
        />

        {/* Modal editar caso */}
        <EditCaseModal
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          caseId={editTarget?.CasoId}
          caseData={editTarget}
          onSaved={async () => {
            await load();
            setDetailRefreshKey((k) => k + 1);
            showToast("Cambios guardados", "success", 5000);
          }}
        />
      </div>
      
      {/* Modal cambiar estado */}
      <ChangeStatusModal
        open={openStatus}
        onClose={() => {
          setOpenStatus(false);
          setStatusTarget(null);
        }}
        caseId={statusTarget?.CasoId}
        caseData={statusTarget}
        currentStatus={statusTarget?.EstadoCodigo}
        onConfirm={async (estadoCodigo) => {
          await changeCaseStatus(statusTarget.CasoId, estadoCodigo);
          await load();
          setDetailRefreshKey((k) => k + 1);
          showToast("Estado actualizado", "success", 5000);
        }}
      />

      {/* Modal confirmar eliminación de caso */}
      <ConfirmModal
        open={openDeleteCase}
        title="Eliminar caso"
        message={
          caseToDelete
            ? `¿Deseas eliminar el caso "${caseToDelete.CodigoCaso}"? Esta acción no se puede deshacer.`
            : "¿Deseas eliminar este caso?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setOpenDeleteCase(false);
          setCaseToDelete(null);
        }}
        onConfirm={confirmDeleteCase}
      />

      {/* Modal cambiar estado */}
      {openChangeStatus ? (
        <div style={overlay} onClick={() => (savingStatus ? null : setOpenChangeStatus(false))}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Cambiar estado</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <select value={newEstado} onChange={(e) => setNewEstado(e.target.value)} style={input}>
                {ESTADOS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => setOpenChangeStatus(false)}
                  disabled={savingStatus}
                  style={btnGhost}
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmChangeStatus}
                  disabled={savingStatus}
                  style={btnPrimary}
                >
                  {savingStatus ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
// Componente para ítems de menú (editar, cambiar estado, eliminar)
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
