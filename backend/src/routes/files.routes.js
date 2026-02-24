/**
 * Rutas de Gestión de Archivos de Casos
 * 
 * Endpoints:
 * - GET /cases/:id/files: Lista archivos del caso
 * - POST /cases/:id/files: Sube archivo al caso
 * - DELETE /cases/:id/files/:fileId: Elimina archivo
 * 
 * Middleware: Multer para manejo de uploads
 */

const router = require("express").Router();
const path = require("path");
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const { upload } = require("../middlewares/upload.middleware");
const { registerCaseFile, listCaseFiles, deleteCaseFile } = require("../services/files.service");

router.get(
  "/cases/:id/files",
  authRequired,
  requirePermission("CASES_READ"),
  async (req, res) => {
    try {
      const casoId = Number(req.params.id);
      const rows = await listCaseFiles(casoId);
      res.json({ ok: true, files: rows });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  }
);

router.post(
  "/cases/:id/files",
  authRequired,
  requirePermission("FILES_UPLOAD"),
  upload.single("file"),
  async (req, res) => {
    try {
      const casoId = Number(req.params.id);
      const categoria = req.body?.categoria || null;

      if (!req.file) return res.status(400).json({ ok: false, message: "Archivo requerido" });

      const ruta = `/uploads/${req.file.filename}`;

      const r = await registerCaseFile({
        casoId,
        usuarioId: req.user.usuarioId,
        categoria,
        nombreOriginal: req.file.originalname,
        nombreServidor: req.file.filename,
        mimeType: req.file.mimetype,
        tamanoBytes: req.file.size,
        ruta,
      });

      res.status(201).json({ ok: true, ...r, ruta });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  }
);

router.delete(
  "/cases/:id/files/:fileId",
  authRequired,
  requirePermission("FILES_UPLOAD"),
  async (req, res) => {
    try {
      const casoId = Number(req.params.id);
      const fileId = Number(req.params.fileId);

      if (!casoId || !fileId) {
        return res.status(400).json({ ok: false, message: "Parámetros inválidos" });
      }

      const r = await deleteCaseFile(casoId, fileId);
      if (r.notFound) {
        return res.status(404).json({ ok: false, message: "Archivo no encontrado" });
      }

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  }
);

module.exports = router;
