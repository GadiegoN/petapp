import type { DocumentData } from "firebase/firestore";

export type DuplicateCandidate = {
  id: string;
  title: string;
  detail: string;
  score: number;
  reasons: string[];
};

export type DuplicateSourceItem = {
  id: string;
  data: DocumentData;
};

export function findStreetDogDuplicates(
  pendingId: string,
  pendingData: DocumentData,
  allDogs: DuplicateSourceItem[],
) {
  return allDogs
    .filter((dog) => dog.id !== pendingId && dog.data.approvalStatus !== "rejected")
    .map((dog) => scoreStreetDogDuplicate(pendingData, dog))
    .filter((candidate): candidate is DuplicateCandidate => Boolean(candidate))
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);
}

export function findSupportPointDuplicates(
  pendingId: string,
  pendingData: DocumentData,
  allPoints: DuplicateSourceItem[],
) {
  return allPoints
    .filter(
      (point) => point.id !== pendingId && point.data.approvalStatus !== "rejected",
    )
    .map((point) => scoreSupportPointDuplicate(pendingData, point))
    .filter((candidate): candidate is DuplicateCandidate => Boolean(candidate))
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);
}

function scoreStreetDogDuplicate(
  pendingData: DocumentData,
  candidate: DuplicateSourceItem,
): DuplicateCandidate | null {
  const candidateData = candidate.data;
  const reasons: string[] = [];
  let score = 0;

  if (sameNormalized(pendingData.nickname, candidateData.nickname)) {
    score += 30;
    reasons.push("mesmo apelido");
  }

  if (sameNormalized(pendingData.regionLabel, candidateData.regionLabel)) {
    score += 25;
    reasons.push("mesma regiao");
  }

  if (sameNormalized(pendingData.color, candidateData.color)) {
    score += 15;
    reasons.push("mesma cor");
  }

  if (pendingData.size && pendingData.size === candidateData.size) {
    score += 10;
    reasons.push("mesmo porte");
  }

  if (pendingData.sex && pendingData.sex === candidateData.sex) {
    score += 10;
    reasons.push("mesmo sexo");
  }

  if (
    sameNormalized(pendingData.approximateBreed, candidateData.approximateBreed)
  ) {
    score += 10;
    reasons.push("raca aproximada parecida");
  }

  const distance = distanceInMeters(
    pendingData.mainLocation,
    candidateData.mainLocation,
  );

  if (distance !== null && distance <= 250) {
    score += 30;
    reasons.push(`localizacao a ${Math.round(distance)}m`);
  }

  if (score < 35) {
    return null;
  }

  return {
    id: candidate.id,
    title: String(candidateData.nickname || "Sem apelido"),
    detail: String(candidateData.regionLabel || candidateData.color || ""),
    score,
    reasons,
  };
}

function scoreSupportPointDuplicate(
  pendingData: DocumentData,
  candidate: DuplicateSourceItem,
): DuplicateCandidate | null {
  const candidateData = candidate.data;
  const reasons: string[] = [];
  let score = 0;

  if (sameNormalized(pendingData.name, candidateData.name)) {
    score += 35;
    reasons.push("mesmo nome");
  }

  if (pendingData.type && pendingData.type === candidateData.type) {
    score += 15;
    reasons.push("mesmo tipo");
  }

  const distance = distanceInMeters(pendingData.location, candidateData.location);

  if (distance !== null && distance <= 100) {
    score += 45;
    reasons.push(`localizacao a ${Math.round(distance)}m`);
  } else if (distance !== null && distance <= 300) {
    score += 25;
    reasons.push(`localizacao proxima (${Math.round(distance)}m)`);
  }

  if (score < 35) {
    return null;
  }

  return {
    id: candidate.id,
    title: String(candidateData.name || "Sem nome"),
    detail: String(candidateData.type || ""),
    score,
    reasons,
  };
}

function sameNormalized(first: unknown, second: unknown) {
  const normalizedFirst = normalizeText(first);
  const normalizedSecond = normalizeText(second);

  return Boolean(normalizedFirst) && normalizedFirst === normalizedSecond;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function distanceInMeters(first: unknown, second: unknown) {
  if (!isLocation(first) || !isLocation(second)) {
    return null;
  }

  const earthRadius = 6371000;
  const firstLat = toRadians(first.latitude);
  const secondLat = toRadians(second.latitude);
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLon = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
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
