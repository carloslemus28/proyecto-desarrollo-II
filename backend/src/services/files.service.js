/**
 * Servicio de Archivos - Gestión de archivos adjuntos de casos
 * 
 * Responsabilidades:
 * - Registrar archivos subidos en la base de datos
 * - Listar archivos de un caso
 * - Eliminar archivos
 * - Categorizar archivos (CONTRATO, EVIDENCIA, etc.)
 * - Sanitizar nombres de archivo
 * 
 * Almacenamiento:
 * - Archivos se guardan en /backend/src/uploads
 * - Nombres incluyen timestamp + random + nombre original
 * - Se mantiene registro en BD para auditoría
 */

const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");

async function registerCaseFile({
  casoId,
  usuarioId,
  categoria,
  nombreOriginal,
  nombreServidor,
  mimeType,
  tamanoBytes,
  ruta,
}) {
  const [r] = await pool.execute(
    `INSERT INTO CasosArchivos
     (CasoId, UsuarioId, Categoria, NombreOriginal, NombreServidor, MimeType, TamanoBytes, Ruta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [casoId, usuarioId, categoria || null, nombreOriginal, nombreServidor, mimeType || null, tamanoBytes || null, ruta]
  );
  return { archivoId: r.insertId };
}

async function listCaseFiles(casoId) {
  const [rows] = await pool.execute(
    `SELECT ArchivoId, CasoId, UsuarioId, Categoria, NombreOriginal, NombreServidor,
            MimeType, TamanoBytes, Ruta, CreadoEn
     FROM CasosArchivos
     WHERE CasoId = ?
     ORDER BY ArchivoId DESC`,
    [casoId]
  );
  return rows;
}

/**
 * Elimina el registro del archivo y el archivo físico del disco.
 * @returns {Object} { ok: true } o { notFound: true }
 */
async function deleteCaseFile(casoId, archivoId) {
  // 1) Buscar el archivo y validar que pertenzca al caso
  const [rows] = await pool.execute(
    `SELECT ArchivoId, NombreServidor, Ruta
     FROM CasosArchivos
     WHERE CasoId = ? AND ArchivoId = ?`,
    [casoId, archivoId]
  );

  if (!rows[0]) return { notFound: true };

  const file = rows[0];

  // 2) Borrar de BD
  await pool.execute(
    `DELETE FROM CasosArchivos WHERE CasoId = ? AND ArchivoId = ?`,
    [casoId, archivoId]
  );

  // 3) Borrar archivo
  const srcDir = path.join(__dirname, "..");
  const uploadsDir = path.join(srcDir, "uploads");
  const absolutePath = path.join(uploadsDir, file.NombreServidor);

  try {
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  } catch (e) {
    console.error(`Error al eliminar archivo: ${e.message}`);
  }

  return { ok: true };
}

module.exports = { registerCaseFile, listCaseFiles, deleteCaseFile };
