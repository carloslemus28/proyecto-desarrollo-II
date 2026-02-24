/**
 * Configuración y fix para Leaflet/React-Leaflet
 * 
 * Responsabilidades:
 * - Configurar recursos estáticos de marcadores
 * - Resolver problema de missing marker icons en React-Leaflet
 * - Definir estilos por defecto de mapa
 * 
 * Es necesario ejecutar esto antes de renderizar mapas
 * Se importa en src/index.js
 */

import L from "leaflet";

// Cargar assets del marker desde leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Evita que Leaflet intente resolver rutas viejas
delete L.Icon.Default.prototype._getIconUrl;

// Forzar rutas correctas
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
