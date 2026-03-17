/**
 * Ruta de Integración WhatsApp
 *
 * Endpoint:
 * - GET /cases/:id/wa: Retorna URL de WhatsApp pre-formateada para contactar deudor
 *
 * Función:
 * - Genera mensaje predefinido y vincula de WhatsApp
 * - Soporta teléfono legacy (Telefono)
 * - Soporta teléfono separado (TelefonoPrefijo + TelefonoNumero)
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const { pool } = require("../config/db");

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits || null;
}

function buildWhatsAppPhone(row) {
  // ✅ prioridad: nuevo esquema separado
  const prefijo = row.TelefonoPrefijo ? String(row.TelefonoPrefijo) : "";
  const numero = row.TelefonoNumero ? String(row.TelefonoNumero) : "";

  const composed = normalizePhone(`${prefijo}${numero}`);
  if (composed) return composed;

  // ✅ fallback: esquema anterior
  return normalizePhone(row.Telefono);
}

router.get("/cases/:id/wa", authRequired, requirePermission("CASES_READ"), async (req, res) => {
  try {
    const casoId = Number(req.params.id);

    if (!Number.isInteger(casoId) || casoId <= 0) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const [rows] = await pool.execute(
      `SELECT
          d.TelefonoPais,
          d.TelefonoPrefijo,
          d.TelefonoNumero,
          d.Nombres,
          d.Apellidos,
          c.CodigoCaso,
          c.Monto
       FROM Casos c
       JOIN Deudores d ON d.DeudorId = c.DeudorId
       WHERE c.CasoId = ? AND c.Activo = 1`,
      [casoId]
    );

    if (!rows[0]) {
      return res.status(404).json({ ok: false, message: "Caso no encontrado" });
    }

    const row = rows[0];
    const phone = buildWhatsAppPhone(row);

    if (!phone) {
      return res.status(400).json({ ok: false, message: "Deudor sin teléfono válido" });
    }

    const msg =
      `Hola ${row.Nombres} ${row.Apellidos}, ` +
      `le contactamos por su caso ${row.CodigoCaso} ` +
      `por monto $${row.Monto}. ¿Podemos coordinar su pago?`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    return res.json({ ok: true, phone, url });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;