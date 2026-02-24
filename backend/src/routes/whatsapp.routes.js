/**
 * Ruta de Integración WhatsApp
 * 
 * Endpoint:
 * - GET /cases/:id/wa: Retorna URL de WhatsApp pre-formateada para contactar deudor
 * 
 * Funcíon: Genera mensaje predefinido y vincula de WhatsApp
 * Normalización: Convierte números a formato del país
 */

const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const { pool } = require("../config/db");

function normalizePhoneToE164(phone) {
  // Normaliza números en formato del país
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 8) return `503${digits}`;
  if (digits.startsWith("503") && digits.length >= 11) return digits;
  return digits; 
}

router.get("/cases/:id/wa", authRequired, requirePermission("CASES_READ"), async (req, res) => {
  try {
    const casoId = Number(req.params.id);

    const [rows] = await pool.execute(
      `SELECT d.Telefono, d.Nombres, d.Apellidos, c.CodigoCaso, c.Monto
       FROM Casos c
       JOIN Deudores d ON d.DeudorId = c.DeudorId
       WHERE c.CasoId = ?`,
      [casoId]
    );

    if (!rows[0]) return res.status(404).json({ ok: false, message: "Caso no encontrado" });

    const phone = normalizePhoneToE164(rows[0].Telefono);
    if (!phone) return res.status(400).json({ ok: false, message: "Deudor sin teléfono" });

    const msg = `Hola ${rows[0].Nombres} ${rows[0].Apellidos}, le contactamos por su caso ${rows[0].CodigoCaso} por monto $${rows[0].Monto}. ¿Podemos coordinar su pago?`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    res.json({ ok: true, phone, url });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
