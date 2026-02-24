/**
 * Configuración de la conexión a la base de datos
 * 
 * Establece un pool de conexiones MySQL que permite:
 * - Reutilizar conexiones establecidas
 * - Limitar conexiones simultáneas
 * - Manejar cola de espera para nuevas conexiones
 * 
 * Variables de entorno requeridas:
 * - MYSQL_HOST: Host de la base de datos
 * - MYSQL_PORT: Puerto de MySQL
 * - MYSQL_USER: Usuario de base de datos
 * - MYSQL_PASSWORD: Contraseña
 * - MYSQL_DATABASE: Nombre de la base de datos
 */

const mysql = require("mysql2/promise");
require("dotenv").config();
// Crear un pool de conexiones MySQL con la configuración proporcionada por las variables de entorno
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = {
  pool,
};
