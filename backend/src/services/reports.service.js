/**
 * Servicio de Reportes - Generación de reportes en múltiples formatos
 * 
 * Responsabilidades:
 * - Generar reportes de casos con filtros avanzados
 * - Calcular KPIs (Total adeudado, casos por estado, etc.)
 * - Exportar a CSV para análisis
 * - Exportar a PDF profesional con diseño
 * - Incluir gráficos y estadísticas en reportes
 * 
 * Filtros soportados:
 * - Estado del caso
 * - Agente asignado
 * - Rango de fechas
 */

const { pool } = require("../config/db");
const PDFDocument = require("pdfkit");

/*Filtros SQL*/

function buildWhere({ estado, agenteId, from, to }) {
  let where = ` WHERE c.Activo = 1 `;
  const params = [];

  if (estado) {
    where += ` AND ce.Codigo = ? `;
    params.push(estado);
  }

  if (agenteId) {
    where += ` AND c.AsignadoAUsuarioId = ? `;
    params.push(agenteId);
  }

  if (from) {
    where += ` AND DATE(c.FechaApertura) >= ? `;
    params.push(from);
  }

  if (to) {
    where += ` AND DATE(c.FechaApertura) <= ? `;
    params.push(to);
  }

  return { where, params };
}

/* Consulta principal */

async function getCasesReport(filters) {
  const { where, params } = buildWhere(filters);

  const sql = `
    SELECT
      c.CasoId,
      c.CodigoCaso,
      c.Monto,
      c.Descripcion,
      c.FechaApertura,
      c.FechaCierre,
      ce.Codigo AS EstadoCodigo,
      ce.Nombre AS EstadoNombre,
      d.Nombres,
      d.Apellidos,
      d.Telefono,
      d.Direccion,
      c.AsignadoAUsuarioId,
      u.Nombre AS AgenteNombre,
      u.Email AS AgenteEmail
    FROM Casos c
    JOIN CatalogoEstados ce ON ce.EstadoId = c.EstadoId
    JOIN Deudores d ON d.DeudorId = c.DeudorId
    LEFT JOIN Usuarios u ON u.UsuarioId = c.AsignadoAUsuarioId
    ${where}
    ORDER BY c.CasoId DESC
  `;

  const [rows] = await pool.execute(sql, params);

  const sqlKpi = `
    SELECT
      SUM(CASE WHEN ce.Codigo <> 'CERRADO' THEN 1 ELSE 0 END) AS casosActivos,
      SUM(CASE WHEN ce.Codigo = 'CERRADO' THEN 1 ELSE 0 END) AS casosCerrados,
      SUM(CASE WHEN ce.Codigo = 'PROMESA_PAGO' THEN 1 ELSE 0 END) AS promesasPago,
      SUM(CASE WHEN ce.Codigo <> 'CERRADO' THEN c.Monto ELSE 0 END) AS totalAdeudado
    FROM Casos c
    JOIN CatalogoEstados ce ON ce.EstadoId = c.EstadoId
    ${where}
  `;

  const [kpiRows] = await pool.execute(sqlKpi, params);
  const kpi = kpiRows?.[0] || {
    casosActivos: 0,
    casosCerrados: 0,
    promesasPago: 0,
    totalAdeudado: 0,
  };

  const normalizedKpi = {
    casosActivos: Number(kpi.casosActivos || 0),
    casosCerrados: Number(kpi.casosCerrados || 0),
    promesasPago: Number(kpi.promesasPago || 0),
    totalAdeudado: Number(kpi.totalAdeudado || 0),
  };

  return { cases: rows, kpi: normalizedKpi };
}

/*CSV Export */

function escCsv(v) {
  if (v == null) return "";
  const s = String(v);
  const needs = /[",\n]/.test(s);
  const safe = s.replace(/"/g, '""');
  return needs ? `"${safe}"` : safe;
}

function buildCsv(rows, kpi) {
  const header = [
    "CodigoCaso",
    "Estado",
    "Monto",
    "FechaApertura",
    "FechaCierre",
    "Deudor",
    "Telefono",
    "Direccion",
    "Agente",
  ].join(",");

  const lines = rows.map((r) => {
    const deudor = `${r.Nombres || ""} ${r.Apellidos || ""}`.trim();
    const agente = r.AgenteNombre ? `${r.AgenteNombre} (${r.AgenteEmail || ""})` : "Sin asignar";

    return [
      escCsv(r.CodigoCaso),
      escCsv(r.EstadoCodigo),
      escCsv(r.Monto),
      escCsv(r.FechaApertura),
      escCsv(r.FechaCierre),
      escCsv(deudor),
      escCsv(r.Telefono),
      escCsv(r.Direccion),
      escCsv(agente),
    ].join(",");
  });

  const kpiLines = [
    "KPI,Valor",
    `Total adeudado,${escCsv(kpi.totalAdeudado)}`,
    `Casos activos,${escCsv(kpi.casosActivos)}`,
    `Casos cerrados,${escCsv(kpi.casosCerrados)}`,
    `Promesas de pago,${escCsv(kpi.promesasPago)}`,
    "",
    header,
    ...lines,
  ];

  return kpiLines.join("\n");
}

/* PDF Export */

function buildPdfBuffer({ cases, kpi, filters, generatedBy, generatedAt }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const left = doc.page.margins.left;
      const right = doc.page.margins.right;
      const contentWidth = doc.page.width - left - right;

      const pad2 = (n) => String(n).padStart(2, "0");

      function formatDateTime(v) {
        if (!v) return "";
        const d = v instanceof Date ? v : new Date(v);
        if (Number.isNaN(d.getTime())) return String(v);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
      }

      function money(v) {
        return `$${Number(v || 0).toFixed(2)}`;
      }

      function drawHeader() {
        doc.fillColor("#111");
        doc.fontSize(28).text("Reporte de Casos", { align: "left" });

        doc.moveDown(0.6);

        doc.fontSize(14).fillColor("#111");
        doc.text(
          `Generado por: ${generatedBy?.nombre || "Usuario"}${generatedBy?.email ? ` (${generatedBy.email})` : ""}`
        );
        doc.text(`Fecha de generación: ${formatDateTime(generatedAt || new Date())}`);

        doc.moveDown(0.8);

        doc.fontSize(20).fillColor("#111").text("Resumen");
        doc.moveDown(0.2);

        doc.fontSize(18).fillColor("#111");
        doc.text(`Total adeudado: ${money(kpi?.totalAdeudado)}`);
        doc.text(`Casos activos: ${Number(kpi?.casosActivos || 0)}`);
        doc.text(`Casos cerrados: ${Number(kpi?.casosCerrados || 0)}`);
        doc.text(`Promesas de pago: ${Number(kpi?.promesasPago || 0)}`);

        doc.moveDown(0.9);
      }

      const W = contentWidth;

      const wCodigo  = Math.floor(W * 0.20);
      const wEstado  = Math.floor(W * 0.16);
      const wAgente  = Math.floor(W * 0.30);
      const wMonto   = Math.floor(W * 0.14);
      const wApert   = W - (wCodigo + wEstado + wAgente + wMonto);

      const col = {
        codigo:  { x: left,                       w: wCodigo },
        estado:  { x: left + wCodigo,            w: wEstado },
        agente:  { x: left + wCodigo + wEstado,  w: wAgente },
        monto:   { x: left + wCodigo + wEstado + wAgente, w: wMonto },
        apertura:{ x: left + wCodigo + wEstado + wAgente + wMonto, w: wApert },
      };

      const tableLeft = left;
      const tableRight = left + contentWidth;

      const headerH = 28;
      const rowH = 36;

      function drawTableTitle() {
        doc.fontSize(22).fillColor("#111").text("Casos");
        doc.moveDown(0.5);
      }

      function drawTableHeader() {
        const y = doc.y;

        doc.save();
        doc.rect(tableLeft, y, contentWidth, headerH).fill("#f3f4f6");
        doc.restore();

        doc.fillColor("#111");
        doc.fontSize(10);

        const yy = y + 8;

        doc.text("Código", col.codigo.x + 8, yy, { width: col.codigo.w - 16 });
        doc.text("Estado", col.estado.x + 8, yy, { width: col.estado.w - 16 });
        doc.text("Agente", col.agente.x + 8, yy, { width: col.agente.w - 16 });
        doc.text("Monto", col.monto.x + 8, yy, { width: col.monto.w - 16, align: "right" });
        doc.text("Apertura", col.apertura.x + 8, yy, { width: col.apertura.w - 16 });

        doc
          .moveTo(tableLeft, y + headerH)
          .lineTo(tableRight, y + headerH)
          .strokeColor("#e5e7eb")
          .stroke();

        doc.y = y + headerH + 12;
      }

      function ensureSpace(needed) {
        const bottomLimit = doc.page.height - doc.page.margins.bottom - 20;
        if (doc.y + needed > bottomLimit) {
          doc.addPage();
          drawHeader();
          drawTableTitle();
          drawTableHeader();
        }
      }

      function drawRow(r) {
        ensureSpace(rowH);

        const y = doc.y;

        const agenteNombre = (r?.AgenteNombre || "").trim();
        const agenteEmail = (r?.AgenteEmail || "").trim();
        const agenteLine1 = agenteNombre || "Sin asignar";
        const agenteLine2 = agenteEmail ? `(${agenteEmail})` : "";

        doc.fillColor("#111");
        doc.fontSize(9);

        doc.text(String(r?.CodigoCaso || ""), col.codigo.x + 8, y, { width: col.codigo.w - 16 });
        doc.text(String(r?.EstadoCodigo || ""), col.estado.x + 8, y, { width: col.estado.w - 16 });
        doc.text(agenteLine1, col.agente.x + 8, y, { width: col.agente.w - 16 });

        if (agenteLine2) {
          doc.fillColor("#374151").fontSize(8);
          doc.text(agenteLine2, col.agente.x + 8, y + 14, { width: col.agente.w - 16 });
          doc.fillColor("#111").fontSize(9);
        }

        doc.text(money(r?.Monto), col.monto.x + 8, y, {
          width: col.monto.w - 16,
          align: "right",
        });

        doc.text(formatDateTime(r?.FechaApertura), col.apertura.x + 8, y, {
          width: col.apertura.w - 16,
        });
        doc
          .moveTo(tableLeft, y + rowH)
          .lineTo(tableRight, y + rowH)
          .strokeColor("#e5e7eb")
          .stroke();

        doc.y = y + rowH + 10;
      }

      drawHeader();
      drawTableTitle();
      drawTableHeader();

      const maxRows = 500;
      const rows = (cases || []).slice(0, maxRows);

      for (const r of rows) {
        drawRow(r);
      }

      if ((cases || []).length > maxRows) {
        doc.moveDown(0.6);
        doc.fontSize(12).fillColor("#6b7280").text(`* Se exportaron ${maxRows} de ${cases.length} casos (límite del PDF).`);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  getCasesReport,
  buildCsv,
  buildPdfBuffer,
};
