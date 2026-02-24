/**
 * Página de Reportes - Generación y análisis de reportes (solo ADMIN)
 * 
 * Responsabilidades:
 * - Mostrar filtros: estado, agente, fechas
 * - Mostrar tabla con datos de casos
 * - Calcular y mostrar KPIs
 * - Descargar reporte en CSV
 * - Descargar reporte en PDF
 * - Graficar distribución de estados
 * - Analizar montos adeudados
 * 
 * Filtros:
 * - Estado del caso
 * - Agente/Usuario asignado
 * - Rango de fechas (desde/hasta)
 */

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastContext";

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  // filtros
  const [estado, setEstado] = useState("");
  const [agenteId, setAgenteId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // agentes
  const [agents, setAgents] = useState([]);

  // datos
  const [kpi, setKpi] = useState({
    totalAdeudado: 0,
    casosActivos: 0,
    casosCerrados: 0,
    promesasPago: 0,
  });

  const [rows, setRows] = useState([]);
// Opciones de estado para filtro
  const estados = useMemo(
    () => [
      { v: "", t: "Todos" },
      { v: "NUEVO", t: "Nuevo" },
      { v: "EN_GESTION", t: "En gestión" },
      { v: "PROMESA_PAGO", t: "Promesa de pago" },
      { v: "INCUMPLIDO", t: "Incumplido" },
      { v: "CERRADO", t: "Cerrado" },
    ],
    []
  );
// Construir query string para filtros
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (estado) p.set("estado", estado);
    if (agenteId) p.set("agenteId", agenteId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [estado, agenteId, from, to]);
// Función para formatear montos como dinero
  function money(n) {
    const v = Number(n || 0);
    return `$${v.toFixed(2)}`;
  }

  async function loadAgents() {
    try {
      const { data } = await api.get("/users");
      setAgents((data.users || []).filter((u) => u.Activo === 1));
    } catch {
      setAgents([]);
    }
  }
// Función para cargar reporte según filtros
  async function loadReport() {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/cases${qs ? `?${qs}` : ""}`);
      setRows(data.cases || []);
      setKpi(
        data.kpi || {
          totalAdeudado: 0,
          casosActivos: 0,
          casosCerrados: 0,
          promesasPago: 0,
        }
      );
    } catch (e) {
      setRows([]);
      showToast(e?.response?.data?.message || "No se pudo cargar el reporte.", "error", 5000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, isAdmin]);
// Función para forzar descarga de archivos (CSV/PDF)
  function forceDownload(blobData, filename) {
    const blob = new Blob([blobData]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
// Función para descargar reporte en CSV
  async function downloadCsv() {
    try {
      const r = await api.get(`/reports/cases.csv${qs ? `?${qs}` : ""}`, { responseType: "blob" });
      forceDownload(r.data, "reporte_casos.csv");
      showToast("CSV descargado", "success", 4000);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo exportar CSV.", "error", 5000);
    }
  }
// Función para descargar reporte en PDF
  async function downloadPdf() {
    try {
      const r = await api.get(`/reports/cases.pdf${qs ? `?${qs}` : ""}`, { responseType: "blob" });
      forceDownload(r.data, "reporte_casos.pdf");
      showToast("PDF descargado", "success", 4000);
    } catch (e) {
      showToast(e?.response?.data?.message || "No se pudo exportar PDF.", "error", 5000);
    }
  }
// Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div style={card}>
        <h2>Reportes</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }
// Renderizar página de reportes con filtros y tabla de resultados
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <h2>Reportes</h2>
            <p style={{ opacity: 0.7, marginTop: 6 }}>
              Reporte de casos por estado, agente y rango de fechas.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={downloadCsv} style={softBtn}>Exportar CSV</button>
            <button onClick={downloadPdf} style={primaryBtn}>Exportar PDF</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
          <div>
            <div style={label}>Estado</div>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} style={input}>
              {estados.map((x) => (
                <option key={x.v} value={x.v}>{x.t}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={label}>Agente</div>
            <select value={agenteId} onChange={(e) => setAgenteId(e.target.value)} style={input}>
              <option value="">Todos</option>
              {agents.map((a) => (
                <option key={a.UsuarioId} value={a.UsuarioId}>
                  {a.Nombre} ({a.Email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={label}>Desde</div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} />
          </div>

          <div>
            <div style={label}>Hasta</div>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setEstado("");
              setAgenteId("");
              setFrom("");
              setTo("");
            }}
            style={softBtn}
            disabled={loading}
          >
            Limpiar Filtro
          </button>
        </div>
      </div>

      {/*KPI*/}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard title="Total adeudado" value={money(kpi.totalAdeudado)} />
        <KpiCard title="Casos activos" value={kpi.casosActivos} />
        <KpiCard title="Casos cerrados" value={kpi.casosCerrados} />
        <KpiCard title="Promesas de pago" value={kpi.promesasPago} />
      </div>

      {/* Tabla */}
      <div style={card}>
        <h3>Resultados</h3>
        {loading ? <p>Cargando...</p> : null}

        <div style={{ marginTop: 10, overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Código</th>
                <th style={th}>Estado</th>
                <th style={th}>Monto</th>
                <th style={th}>Apertura</th>
                <th style={th}>Cierre</th>
                <th style={th}>Deudor</th>
                <th style={th}>Agente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.CasoId}>
                  <td style={td}><b>{r.CodigoCaso}</b></td>
                  <td style={td}>{r.EstadoCodigo}</td>
                  <td style={td}>{money(r.Monto)}</td>
                  <td style={td}>{r.FechaApertura ? new Date(r.FechaApertura).toLocaleString() : "-"}</td>
                  <td style={td}>{r.FechaCierre ? new Date(r.FechaCierre).toLocaleString() : "-"}</td>
                  <td style={td}>{r.Nombres} {r.Apellidos}</td>
                  <td style={td}>{r.AgenteNombre || "Sin asignar"}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td style={td} colSpan={7}>No hay resultados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// Componente para mostrar KPIs en tarjetas
function KpiCard({ title, value }) {
  return (
    <div style={kpiCard}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const card = { background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb" };

const label = { fontSize: 12, opacity: 0.75, marginBottom: 6 };

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const primaryBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  background: "#111827",
  color: "#fff",
};

const softBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  background: "#fff",
  color: "#111827",
};

const kpiCard = {
  background: "#fff",
  borderRadius: 12,
  padding: 14,
  border: "1px solid #e5e7eb",
};

const table = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
};

const th = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const td = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 13,
  whiteSpace: "nowrap",
};
