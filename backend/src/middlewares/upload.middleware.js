/**
 * Middleware de carga de archivos - Configura Multer para gestionar uploads
 * 
 * Responsabilidades:
 * - Almacenar archivos en el directorio /backend/src/uploads
 * - Generar nombres únicos: timestamp-random-originalname
 * - Arreglar nombres de archivo para evitar caracteres especiales problemáticos
 * - Aplicar límite de tamaño de 15MB por archivo
 * 
 * Arreglo de nombres de archivo:
 * - Reemplaza caracteres especiales y acentos con underscore
 * - Mantiene números, puntos, guiones y espacios
 */

const path = require("path");
const multer = require("multer");

// Configurar almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Los archivos se guardan en /uploads relativo a este middleware
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    // Arreglar el nombre original removiendo caracteres especiales y acentos
    const safeOriginal = file.originalname.replace(/[^\w.\-() ]/g, "_");
    // Generar ID único: timestamp + número aleatorio
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Máximo 15MB
});

module.exports = { upload };
