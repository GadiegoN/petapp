"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LocationSelectorMapProps = {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
};

const pulseIcon = L.divIcon({
  className: "",
  html: '<div style="width:24px;height:24px;border-radius:999px;border:3px solid #ffffff;background:#9b87ff;box-shadow:0 0 12px rgba(155,135,255,0.6);animation:pulse 2s infinite;" class="animate-pulse"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Programmatic map center/zoom view controller
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Click on map event handler
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function LocationSelectorMap({
  latitude,
  longitude,
  onChange,
}: LocationSelectorMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-lg border border-bd-muted bg-surface-3">
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onClick={onChange} />
        <ChangeMapView center={position} />

        <Marker
          position={position}
          icon={pulseIcon}
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target;
              if (marker) {
                const latLng = marker.getLatLng();
                onChange(latLng.lat, latLng.lng);
              }
            },
          }}
        />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded bg-background/80 px-2 py-1 text-[0.65rem] text-muted border border-bd-muted backdrop-blur-sm">
        Clique no mapa ou arraste o marcador para selecionar
      </div>
    </div>
  );
}
