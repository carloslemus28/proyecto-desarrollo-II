/**
 * Página de Usuarios - Gestión de usuarios del sistema (solo ADMIN)
 * 
 * Responsabilidades:
 * - Listar y buscar usuarios
 * - Crear nuevos usuarios (asignar rol)
 * - Editar información de usuario
 * - Resetear contraseña de usuario
 * - Activar/desactivar usuarios
 * - Eliminar usuarios
 * 
 * Componentes anidados:
 * - CreateUserModal: Crear usuario
 * - EditUserModal: Editar usuario existente
 * - ResetPasswordModal: Cambiar contraseña
 * - ConfirmModal: Confirmación para eliminar
 */

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastContext";

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import ConfirmModal from "../components/ConfirmModal";

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [q, setQ] = useState("");

  // menu
  const [openMenuId, setOpenMenuId] = useState(null);

  // modales
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openPass, setOpenPass] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [target, setTarget] = useState(null);
  const [confirmCfg, setConfirmCfg] = useState({ title: "", message: "", danger: false, action: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data.users || []);
    } catch (e) {
      setUsers([]);
      showToast("No se pudieron cargar los usuarios.", "error", 5000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;

    return users.filter((u) => {
      const text = `${u.Nombre} ${u.Email} ${u.Telefono || ""}`.toLowerCase();
      return text.includes(qq);
    });
  }, [users, q]);
  
// función para activar/desactivar usuario
  async function toggleActive(u) {
    await api.put(`/users/${u.UsuarioId}`, { activo: !u.Activo });
  }

// función para resetear contraseña de usuario
  async function resetPassword(u, newPassword) {
    await api.put(`/users/${u.UsuarioId}/password`, { password: newPassword });
  }

  if (!isAdmin) {
    return (
      <div style={card}>
        <h2>Usuarios</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={card} onClick={() => setOpenMenuId(null)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <h2>Usuarios</h2>
            <p style={{ opacity: 0.7, marginTop: 6 }}>
              Gestión profesional: crear, editar, activar/desactivar y cambiar contraseña.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenCreate(true);
            }}
            style={primaryBtn}
          >
            + Crear Usuario
          </button>
        </div>

        {/* Búsqueda */}
        <div style={{ marginTop: 12 }}>
          <input
            placeholder="Buscar por nombre, email o teléfono..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={input}
          />
        </div>
      </div>

      {/* Listado */}
      <div style={card} onClick={() => setOpenMenuId(null)}>
        <h3>Listado</h3>
        {loading ? <p>Cargando...</p> : null}

        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {filtered.map((u) => (
            <div key={u.UsuarioId} style={userRow}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b>{u.Nombre}</b>

                  {/* Etiqueta de Rol */}
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: u.Rol === "ADMIN" ? "#e0e7ff" : "#dcfce7",
                      color: u.Rol === "ADMIN" ? "#1e3a8a" : "#166534",
                      border: u.Rol === "ADMIN"
                        ? "1px solid #c7d2fe"
                        : "1px solid #bbf7d0",
                    }}
                  >
                    {u.Rol}
                  </span>
                </div>

                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {u.Email}
                </div>

                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Tel: {u.Telefono || "-"} •{" "}
                  <span style={{ fontWeight: 600, color: u.Activo ? "#166534" : "#6b7280" }}>
                    {u.Activo ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>
              </div>

              {/* MENU */}
              <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === u.UsuarioId ? null : u.UsuarioId)}
                  style={dotsBtn}
                  title="Opciones"
                >
                  ⋯
                </button>

                {openMenuId === u.UsuarioId && (
                  <div style={menuBox}>
                    <MenuItem
                      label="Editar"
                      onClick={() => {
                        setTarget(u);
                        setOpenEdit(true);
                        setOpenMenuId(null);
                      }}
                    />

                    

                    <MenuItem
                      label={u.Activo ? "Desactivar" : "Activar"}
                      onClick={() => {
                        setOpenMenuId(null);
                        setConfirmCfg({
                          title: u.Activo ? "Desactivar usuario" : "Activar usuario",
                          message: `¿Seguro que deseas ${u.Activo ? "desactivar" : "activar"} a ${u.Email}?`,
                          danger: false,
                          action: async () => {
                            await toggleActive(u);
                            showToast(`Usuario ${u.Activo ? "desactivado" : "activado"} correctamente`, "success", 5000);
                            await load();
                          },
                        });
                        setOpenConfirm(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 ? <p>No hay usuarios.</p> : null}
        </div>
      </div>

      {/* MODAL CREAR */}
      <CreateUserModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={load}
        showToast={showToast}
      />

      {/* MODAL EDITAR */}
      <EditUserModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        userTarget={target}
        onSaved={load}
        showToast={showToast}
      />

      {/* MODAL CAMBIAR PASS */}
      <ResetPasswordModal
        open={openPass}
        onClose={() => setOpenPass(false)}
        userTarget={target}
        loading={false}
        onConfirm={async (newPass) => {
          try {
            await resetPassword(target, newPass);
            showToast("Contraseña actualizada correctamente", "success", 5000);
            setOpenPass(false);
          } catch (e) {
            const msg = e?.response?.data?.message || "No se pudo actualizar la contraseña.";
            showToast(msg, "error", 5000);
          }
        }}
      />

      {/* MODAL CONFIRMAR */}
      <ConfirmModal
        open={openConfirm}
        title={confirmCfg.title}
        message={confirmCfg.message}
        danger={confirmCfg.danger}
        loading={confirmLoading}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onClose={() => {
          if (confirmLoading) return;
          setOpenConfirm(false);
          setConfirmCfg({ title: "", message: "", danger: false, action: null });
        }}
        onConfirm={async () => {
          if (!confirmCfg.action) return;
          try {
            setConfirmLoading(true);
            await confirmCfg.action();
          } catch (e) {
            const msg = e?.response?.data?.message || "No se pudo completar la acción.";
            showToast(msg, "error", 5000);
          } finally {
            setConfirmLoading(false);
            setOpenConfirm(false);
            setConfirmCfg({ title: "", message: "", danger: false, action: null });
          }
        }}
      />
    </div>
  );
}
// Componente para ítem de menú de opciones de cada usuario
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

const card = { background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb" };

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  marginTop: 8,
};

const primaryBtn = { padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer" };

const userRow = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

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
  top: 40,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
  overflow: "hidden",
  zIndex: 50,
  minWidth: 190,
};
