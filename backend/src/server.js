/**
 * Servidor principal de la API de Cobranza
 * 
 * Responsabilidades:
 * - Inicializar la aplicación Express
 * - Configurar middleware de seguridad (helmet) y CORS
 * - Implementar limitación de rate limiting para protección
 * - Servir el directorio de uploads estáticamente
 * - Registrar todas las rutas API disponibles
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de Seguridad: Helmet protege contra vulnerabilidades HTTP comunes
app.use(helmet());

// Configuración CORS: Permite cookies en peticiones desde el frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Parser de cookies para acceso a cookies en req.cookies
app.use(cookieParser());

// Limitador de rate limiting: Protege contra ataques de fuerza bruta
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
    max: 300, // Máximo 300 requests por ventana
  })
);

// Parseo de JSON con límite de tamaño de 10MB
app.use(express.json({ limit: "10mb" }));

// Endpoint de health check para verificar que la API está operativa
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});

// Servir archivos subidos de forma estática
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Registrar todas las rutas API
const apiRoutes = require("./routes");
app.use("/api", apiRoutes);

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
