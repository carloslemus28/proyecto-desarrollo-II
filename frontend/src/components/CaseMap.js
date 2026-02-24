/**
 * Componente CaseMap - Mapa incrustado con ubicación del caso
 * 
 * Responsabilidades:
 * - Mostrar mapa interactivo con Leaflet
 * - Marcar ubicación del deudor/caso
 * - Permitir interactón con el mapa
 * - Usar OpenStreetMap como proveedor de tiles
 * 
 * Props:
 * - latitud, longitud: coordenadas a mostrar
 * - titulo: texto del popup en el marcador
 */

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
// Componente auxiliar para recentrar el mapa al cambiar las coordenadas
function Recenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);

  return null;
}
// Componente principal
export default function CaseMap({ lat, lng, label }) {
  const position = useMemo(() => {
    if (lat == null || lng == null || lat === "" || lng === "") return null;
    const p = [Number(lat), Number(lng)];
    if (Number.isNaN(p[0]) || Number.isNaN(p[1])) return null;
    return p;
  }, [lat, lng]);

  if (!position) {
    return (
      <div style={{ padding: 12, background: "#fff", borderRadius: 12 }}>
        <b>Ubicación</b>
        <p style={{ marginTop: 6 }}>Este deudor no tiene coordenadas registradas.</p>
      </div>
    );
  }
// Si hay coordenadas válidas, muestra el mapa
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 12 }}>
      <b>Ubicación</b>

      <div style={{ height: 260, marginTop: 10, borderRadius: 12, overflow: "hidden" }}>
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Esto hace que al cambiar lat/lng el mapa se recoloque */}
          <Recenter position={position} />

          {/* Marcador fijo*/}
          <Marker position={position}>
            <Popup>{label || "Deudor"}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
