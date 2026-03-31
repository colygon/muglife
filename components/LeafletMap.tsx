"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom amber marker icon (SVG data URI)
const muglifeIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="%23f59e0b"/>
      <circle cx="12" cy="12" r="6" fill="%231a1107"/>
      <text x="12" y="15" text-anchor="middle" font-size="10" fill="%23fbbf24">☕</text>
    </svg>
  `)}`,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
});

// MugLife HQ coordinates (995 Market Street, SF)
const HQ_POSITION: [number, number] = [37.7825, -122.4099];

interface Props {
  onHQClick: () => void;
}

export default function LeafletMap({ onHQClick }: Props) {
  const onHQClickRef = useRef(onHQClick);
  onHQClickRef.current = onHQClick;

  // Override default Leaflet popup styles for dark theme
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "muglife-leaflet-styles";
    style.textContent = `
      .leaflet-popup-content-wrapper {
        background: #2a1f0f !important;
        color: #fff !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      }
      .leaflet-popup-tip {
        background: #2a1f0f !important;
      }
      .leaflet-popup-close-button {
        color: #fbbf24 !important;
      }
      .leaflet-popup-content {
        margin: 12px 16px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  // Attach click handler to popup button via DOM event delegation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-enter-tower]")) {
        e.stopPropagation();
        onHQClickRef.current();
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <MapContainer
      center={HQ_POSITION}
      zoom={15}
      className="w-full h-full"
      style={{ background: "#1a1107" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <Marker
        position={HQ_POSITION}
        icon={muglifeIcon}
        ref={(ref) => { if (ref) setTimeout(() => ref.openPopup(), 100); }}
      >
        <Popup closeOnClick={false} autoPan={true}>
          <div className="text-center py-1">
            <p className="text-amber-400 font-bold text-base mb-0.5">MugLife HQ</p>
            <p className="text-white/50 text-xs mb-2">995 Market St &middot; Frontier Tower</p>
            <button
              data-enter-tower
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors w-full active:scale-95"
            >
              Enter the Tower
            </button>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
