import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

function Recenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, 17, { animate: true });
  }, [position, map]);

  return null;
}

export default function CaseMap({ lat, lng, label }) {
  const [loading, setLoading] = useState(true);

  const position = useMemo(() => {
    if (lat == null || lng == null || lat === "" || lng === "") return null;
    const p = [Number(lat), Number(lng)];
    if (Number.isNaN(p[0]) || Number.isNaN(p[1])) return null;
    return p;
  }, [lat, lng]);

  useEffect(() => {
    if (!position) return;

    setLoading(true);

    const t = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(t);
  }, [position]);

  if (!position) {
    return (
      <div style={{ padding: 12, background: "#fff", borderRadius: 12 }}>
        <b>Ubicación</b>
        <p style={{ marginTop: 6 }}>Este deudor no tiene coordenadas registradas.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 12 }}>
      <b>Ubicación</b>

      <div
        style={{
          position: "relative",
          height: 260,
          marginTop: 10,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        {loading ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 500,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(1px)",
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              pointerEvents: "none",
            }}
          >
            Cargando mapa...
          </div>
        ) : null}

        <MapContainer
          center={position}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

          <Recenter position={position} />

          <Marker position={position}>
            <Popup>{label || "Deudor"}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}