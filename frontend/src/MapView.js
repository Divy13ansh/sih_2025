import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import "./MapView.css"
import argo_float from "./images/argo_float.png"
import { Link } from "react-router-dom";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;

const oceanMarker = new L.Icon({
  iconUrl: argo_float,
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [50, 50],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView() {
  const [floats, setFloats] = useState([]);

  useEffect(() => {
    fetch((process.env.REACT_APP_BACKEND || "http://localhost:8000") + "/floats")
      .then(r => r.json())
      .then(setFloats)
      .catch(() => setFloats([]));
  }, []);

  return (
    <MapContainer center={[15, 75]} zoom={4} minZoom={3.5} maxZoom={8} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {floats.map(f => f.lat && f.lon ? (
        <Marker key={f.float_id} position={[f.lat, f.lon]} icon={oceanMarker}>
            <Popup>
                <h3>Float ID: {f.float_id}</h3>
                <p>Lat: {f.lat.toFixed(3)}</p>
                <p>Lon: {f.lon.toFixed(3)}</p>
                <Link to={`/float/${f.float_id}`}>
                    <button className="details-btn">View Details</button>
                </Link>
            </Popup>

        </Marker>
      ) : null)}
    </MapContainer>
  );
}
