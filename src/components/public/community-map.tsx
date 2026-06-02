"use client";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type {
  PublicMapDog,
  PublicMapSupportPoint,
} from "@/lib/firebase/community-mappers";

type CommunityMapProps = {
  dogs: PublicMapDog[];
  supportPoints: PublicMapSupportPoint[];
  showDogs: boolean;
  showFood: boolean;
  showWater: boolean;
  showPartners: boolean;
  showDonationPoints: boolean;
};

const dogIcon = L.divIcon({
  className: "",
  html: '<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:999px;background:var(--accent);color:var(--accent-contrast);font-weight:900;border:2px solid var(--foreground);">C</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const pointIcon = L.divIcon({
  className: "",
  html: '<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:var(--accent-strong);color:var(--foreground);font-weight:900;border:2px solid var(--foreground);">P</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const defaultCenter: [number, number] = [-19.936, -47.542];

export function CommunityMap({
  dogs,
  supportPoints,
  showDogs,
  showFood,
  showWater,
  showPartners,
  showDonationPoints,
}: CommunityMapProps) {
  const visiblePoints = supportPoints.filter((point) => {
    if (showDonationPoints && point.type === "donation_point") {
      return true;
    }

    if (showPartners && ["petshop", "commerce", "ngo"].includes(point.type)) {
      return true;
    }

    if (showFood && point.foodAvailable) {
      return true;
    }

    if (showWater && point.waterAvailable) {
      return true;
    }

    return false;
  });

  const firstDog = dogs[0];
  const firstPoint = visiblePoints[0];
  const center: [number, number] = firstDog
    ? [firstDog.latitude, firstDog.longitude]
    : firstPoint
      ? [firstPoint.latitude, firstPoint.longitude]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-[32rem] min-h-[26rem] w-full overflow-hidden rounded-lg border border-bd-muted"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showDogs
        ? dogs.map((dog) => (
            <Marker
              key={`dog-${dog.id}`}
              position={[dog.latitude, dog.longitude]}
              icon={dogIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <strong>{dog.nickname}</strong>
                  <p>Status: {dog.status}</p>
                  <Link href={`/caes/${dog.id}`}>Ver cadastro</Link>
                </div>
              </Popup>
            </Marker>
          ))
        : null}

      {visiblePoints.map((point) => (
        <Marker
          key={`point-${point.id}`}
          position={[point.latitude, point.longitude]}
          icon={pointIcon}
        >
          <Popup>
            <div className="space-y-1">
              <strong>{point.name}</strong>
              <p>Tipo: {point.type}</p>
              <p>
                {point.foodAvailable ? "Racao disponivel" : "Sem racao"} /{" "}
                {point.waterAvailable ? "Agua disponivel" : "Sem agua"}
              </p>
              {point.needsRestock ? <p>Precisa de reposicao</p> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
