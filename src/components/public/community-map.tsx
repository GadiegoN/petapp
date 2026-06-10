"use client";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type {
  PublicMapDog,
  PublicMapSupportPoint,
  PublicMapPartner,
} from "@/lib/firebase/community-mappers";

type CommunityMapProps = {
  dogs: PublicMapDog[];
  supportPoints: PublicMapSupportPoint[];
  partners?: PublicMapPartner[];
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

const orgIcon = L.divIcon({
  className: "",
  html: '<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:999px;background:#9b87ff;color:#ffffff;font-weight:900;border:2px solid var(--foreground);box-shadow:0 0 8px rgba(155,135,255,0.5);">O</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const orgTypeLabels: Record<string, string> = {
  petshop: "Petshop",
  ngo: "ONG / Protetora",
  commerce: "Comércio",
  community_group: "Grupo Comunitário",
  public_agency: "Agência Pública",
};

function formatAddress(address: PublicMapPartner["address"]) {
  if (!address) return "";
  const parts = [];
  if (address.street) {
    parts.push(`${address.street}${address.number ? `, ${address.number}` : ""}`);
  }
  if (address.district) {
    parts.push(address.district);
  }
  if (address.city) {
    parts.push(`${address.city}${address.state ? ` - ${address.state}` : ""}`);
  }
  return parts.join(", ");
}

const defaultCenter: [number, number] = [-19.936, -47.542];

export function CommunityMap({
  dogs,
  supportPoints,
  partners = [],
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
  const firstPartner = partners?.[0];
  const center: [number, number] = firstDog
    ? [firstDog.latitude, firstDog.longitude]
    : firstPoint
      ? [firstPoint.latitude, firstPoint.longitude]
      : firstPartner
        ? [firstPartner.latitude, firstPartner.longitude]
        : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-128 min-h-104 w-full overflow-hidden rounded-lg border border-bd-muted"
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
                  <strong className="block text-sm font-bold text-slate-800">{dog.nickname}</strong>
                  <p className="text-xs text-slate-500">Status: {dog.status}</p>
                  <Link
                    href={`/caes/${dog.id}`}
                    className="block text-xs font-bold text-accent hover:underline mt-2"
                  >
                    Ver perfil completo do cão →
                  </Link>
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
              <strong className="block text-sm font-bold text-slate-800">{point.name}</strong>
              <p className="text-xs text-slate-500">Tipo: {point.type}</p>
              <p className="text-xs text-slate-600">
                {point.foodAvailable ? "Ração disponível" : "Sem ração"} /{" "}
                {point.waterAvailable ? "Água disponível" : "Sem água"}
              </p>
              {point.needsRestock ? (
                <p className="text-xs font-bold text-amber-600">Precisa de reposição</p>
              ) : null}
              <Link
                href={`/pontos/${point.id}`}
                className="block text-xs font-bold text-accent hover:underline mt-2"
              >
                Ver perfil completo do ponto →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}

      {showPartners && partners
        ? partners.map((partner) => (
            <Marker
              key={`partner-${partner.id}`}
              position={[partner.latitude, partner.longitude]}
              icon={orgIcon}
            >
              <Popup>
                <div className="space-y-1.5 p-0.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                    <span className="inline-block size-2 rounded-full bg-indigo-500 animate-pulse" />
                    <strong className="block text-sm font-bold text-slate-800">
                      {partner.name}
                    </strong>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    Categoria: {orgTypeLabels[partner.type] || partner.type}
                  </p>
                  {formatAddress(partner.address) && (
                    <p className="text-xs text-slate-600 leading-normal flex items-start gap-1">
                      <span className="font-semibold text-slate-500">Endereço:</span>{" "}
                      {formatAddress(partner.address)}
                    </p>
                  )}
                  {partner.phone && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">Tel:</span>{" "}
                      {partner.phone}
                    </p>
                  )}
                  {partner.email && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">E-mail:</span>{" "}
                      {partner.email}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))
        : null}
    </MapContainer>
  );
}
