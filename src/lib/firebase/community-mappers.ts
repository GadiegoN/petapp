import type { DocumentData } from "firebase/firestore";

export type PublicMapDog = {
  id: string;
  nickname: string;
  status: string;
  regionLabel: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
};

export type PublicMapSupportPoint = {
  id: string;
  name: string;
  type: string;
  foodAvailable: boolean;
  waterAvailable: boolean;
  needsRestock: boolean;
  latitude: number;
  longitude: number;
};

export type PublicMapPartner = {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  address?: {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
  };
  latitude: number;
  longitude: number;
};

export type PublicStreetDogProfile = {
  id: string;
  nickname: string;
  status: string;
  regionLabel: string;
  photoUrl: string;
  latitude?: number;
  longitude?: number;
  sex: string;
  size: string;
  color: string;
  approximateBreed: string;
  temperament: string;
  notes: string;
  vaccination: string;
  neutering: string;
  qrCodeId: string;
};

export function publicMapDogFromFirestore(
  id: string,
  data: DocumentData,
): PublicMapDog | null {
  const location = data.mainLocation;

  if (!isLocation(location)) {
    return null;
  }

  return {
    id,
    nickname: String(data.nickname || "Sem apelido"),
    status: String(data.status || "street"),
    regionLabel: String(data.regionLabel || ""),
    photoUrl: String(data.photoUrl || ""),
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function publicStreetDogProfileFromFirestore(
  id: string,
  data: DocumentData,
): PublicStreetDogProfile | null {
  const location = data.mainLocation;
  const hasLocation = isLocation(location);

  return {
    id,
    nickname: String(data.nickname || "Sem apelido"),
    status: String(data.status || "street"),
    regionLabel: String(data.regionLabel || ""),
    photoUrl: String(data.photoUrl || ""),
    latitude: hasLocation ? location.latitude : undefined,
    longitude: hasLocation ? location.longitude : undefined,
    sex: String(data.sex || "unknown"),
    size: String(data.size || "unknown"),
    color: String(data.color || ""),
    approximateBreed: String(data.approximateBreed || ""),
    temperament: String(data.temperament || ""),
    notes: String(data.notes || ""),
    vaccination: String(data.vaccination || "unknown"),
    neutering: String(data.neutering || "unknown"),
    qrCodeId: String(data.qrCodeId || ""),
  };
}

export function publicSupportPointFromFirestore(
  id: string,
  data: DocumentData,
): PublicMapSupportPoint | null {
  const location = data.location;

  if (!isLocation(location)) {
    return null;
  }

  return {
    id,
    name: String(data.name || "Ponto de apoio"),
    type: String(data.type || "donation_point"),
    foodAvailable: data.foodAvailable === true,
    waterAvailable: data.waterAvailable === true,
    needsRestock: data.needsRestock === true,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function publicMapPartnerFromFirestore(
  id: string,
  data: DocumentData,
): PublicMapPartner | null {
  const location = data.location;

  if (!isLocation(location)) {
    return null;
  }

  // Apenas organizações com plano Pro ativo podem ser exibidas no mapa público
  if (data.plan !== "pro") {
    return null;
  }

  return {
    id,
    name: String(data.name || "Parceiro"),
    type: String(data.type || "petshop"),
    phone: String(data.phone || ""),
    email: String(data.email || ""),
    address: data.address ? {
      street: data.address.street ? String(data.address.street) : undefined,
      number: data.address.number ? String(data.address.number) : undefined,
      district: data.address.district ? String(data.address.district) : undefined,
      city: data.address.city ? String(data.address.city) : undefined,
      state: data.address.state ? String(data.address.state) : undefined,
      postalCode: data.address.postalCode ? String(data.address.postalCode) : undefined,
      complement: data.address.complement ? String(data.address.complement) : undefined,
    } : undefined,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function isLocation(
  value: unknown,
): value is { latitude: number; longitude: number } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const location = value as { latitude?: unknown; longitude?: unknown };

  return (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  );
}
