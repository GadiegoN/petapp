import type {
  Address,
  EntityStatus,
  GeoPointValue,
  TimestampFields,
  Visibility,
} from "./common";

export type DogSex = "male" | "female" | "unknown";

export type DogSize = "small" | "medium" | "large" | "giant" | "unknown";

export type StreetDogStatus =
  | "street"
  | "rescued"
  | "adopted"
  | "missing"
  | "deceased";

export type HealthState = "unknown" | "yes" | "no" | "partial";

export type StreetDog = TimestampFields & {
  id: string;
  nickname?: string;
  photoUrl?: string;
  sex: DogSex;
  size: DogSize;
  color?: string;
  approximateBreed?: string;
  temperament?: string;
  notes?: string;
  status: StreetDogStatus;
  vaccination: HealthState;
  neutering: HealthState;
  mainLocation?: GeoPointValue;
  regionLabel?: string;
  qrCodeId?: string;
  visibility: Visibility;
  createdByUserId: string;
  approvedByUserId?: string;
  approvalStatus: EntityStatus;
};

export type StreetDogUpdateType =
  | "sighting"
  | "feeding"
  | "health"
  | "vaccination"
  | "neutering"
  | "status_change"
  | "note"
  | "created"
  | "edited"
  | "approved"
  | "rejected"
  | "duplicated";

export type StreetDogUpdate = {
  id: string;
  streetDogId: string;
  type: StreetDogUpdateType;
  description: string;
  photoUrls: string[];
  location?: GeoPointValue;
  createdByUserId: string;
  createdAt?: unknown;
  isPublic: boolean;
};

export type SupportPointType =
  | "petshop"
  | "commerce"
  | "resident"
  | "ngo"
  | "authorized_public_place"
  | "donation_point";

export type SupportPoint = TimestampFields & {
  id: string;
  name: string;
  type: SupportPointType;
  location: GeoPointValue;
  address?: Address;
  foodAvailable: boolean;
  waterAvailable: boolean;
  needsRestock: boolean;
  commonHours?: string;
  responsibleName?: string;
  responsibleContact?: string;
  notes?: string;
  organizationId?: string;
  approvalStatus: EntityStatus;
  visibility: Visibility;
  createdByUserId: string;
};

export type SupportPointUpdateType =
  | "food_refill"
  | "water_refill"
  | "stock_empty"
  | "maintenance"
  | "note"
  | "created"
  | "edited"
  | "approved"
  | "rejected"
  | "duplicated";

export type SupportPointUpdate = {
  id: string;
  supportPointId: string;
  type: SupportPointUpdateType;
  description: string;
  createdByUserId: string;
  createdAt?: unknown;
};
