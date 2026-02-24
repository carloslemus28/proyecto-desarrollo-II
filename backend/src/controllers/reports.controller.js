/**
 * Controlador de Reportes - Genera reportes de casos en múltiples formatos
 * 
 * Responsabilidades:
 * - Generar reportes JSON con estadísticas de casos
 * - Exportar reportes a CSV
 * - Exportar reportes a PDF
 * 
 * Filtros soportados:
 * - estado: filtrar por estado del caso
 * - agenteId: filtrar por usuario asignado
 * - from/to: rango de fechas (YYYY-MM-DD)
 * 
 * Acceso: Solo ADMIN
 */

const { getCasesReport, buildCsv, buildPdfBuffer } = require("../services/reports.service");
const { pool } = require("../config/db");

/**
 * Extrae y valida los filtros de la query string
 */
function parseFilters(req) {
  const estado = (req.query.estado || "").trim() || null;
  const agenteIdRaw = (req.query.agenteId || "").trim();
  const agenteId = agenteIdRaw ? Number(agenteIdRaw) : null;

  const from = (req.query.from || "").trim() || null;
  const to = (req.query.to || "").trim() || null;

  return { estado, agenteId, from, to };
}

/**
 * GET /api/reports/cases - Retorna reporte en formato JSON
 */
async function reportCasesController(req, res) {
  try {
    const filters = parseFilters(req);
    const result = await getCasesReport(filters);
    return res.json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Error generando reporte" });
  }
}

/**
 * GET /api/reports/cases/csv - Descarga reporte en formato CSV
 */
async function reportCasesCsvController(req, res) {
  try {
    const filters = parseFilters(req);
    const { cases, kpi } = await getCasesReport(filters);

    const csv = buildCsv(cases, kpi);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="reporte_casos.csv"`);
    return res.send(csv);
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Error exportando CSV" });
  }
}

/**
 * GET /api/reports/cases/pdf - Descarga reporte en formato PDF
 * Genera PDF profesional con datos del usuario que lo genera
 */
async function reportCasesPdfController(req, res) {
  try {
    const filters = parseFilters(req);
    const { cases, kpi } = await getCasesReport(filters);

    // Obtener datos actuales del usuario para el PDF
    let nombre = req.user?.nombre;
    let email = req.user?.email;

    if (!nombre || !email) {
      const usuarioId = req.user?.usuarioId;
      if (usuarioId) {
        const [rows] = await pool.execute(
          `SELECT Nombre, Email FROM Usuarios WHERE UsuarioId = ? LIMIT 1`,
          [usuarioId]
        );
        nombre = rows?.[0]?.Nombre || nombre || "Usuario";
        email = rows?.[0]?.Email || email || "";
      }
    }

    const generatedBy = { nombre: nombre || "Usuario", email: email || "" };

    const pdfBuffer = await buildPdfBuffer({
      cases,
      kpi,
      filters,
      generatedBy,
      generatedAt: new Date(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="reporte_casos.pdf"`);
    return res.send(pdfBuffer);
  } catch (e) {
    console.error("ERROR PDF:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message || "Error exportando PDF",
    });
  }
}

module.exports = {
  reportCasesController,
  reportCasesCsvController,
  reportCasesPdfController,
};
