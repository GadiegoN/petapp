import type { Address, GeoPointValue, TimestampFields } from "./common";
import type { DogSex, DogSize } from "./community";

export type OrganizationType =
  | "petshop"
  | "ngo"
  | "commerce"
  | "community_group"
  | "public_agency";

export type OrganizationStatus = "pending" | "approved" | "suspended" | "rejected";

export type Organization = TimestampFields & {
  id: string;
  type: OrganizationType;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: Address;
  location?: GeoPointValue;
  ownerUserId: string;
  memberUserIds: string[];
  members?: {
    uid: string;
    displayName: string;
    email: string;
  }[];
  isPublicPartner: boolean;
  status: OrganizationStatus;
  plan?: "free" | "pro";
};

export type Tutor = TimestampFields & {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
  notes?: string;
};

export type DomesticPet = TimestampFields & {
  id: string;
  organizationId: string;
  tutorId: string;
  name: string;
  species: "dog" | "cat" | "other";
  sex: DogSex;
  size: DogSize;
  breed?: string;
  birthDate?: string;
  photoUrl?: string;
  notes?: string;
};

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "done"
  | "cancelled"
  | "no_show";

export type Service = TimestampFields & {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  isActive: boolean;
};

export type Product = TimestampFields & {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  isActive: boolean;
};

export type PetHealthRecordType =
  | "vaccine"
  | "bath"
  | "grooming"
  | "medicine"
  | "exam"
  | "note";

export type PetHealthRecord = {
  id: string;
  organizationId: string;
  domesticPetId: string;
  type: PetHealthRecordType;
  description: string;
  date: string;
  serviceIds: string[];
  productIds: string[];
  createdByUserId: string;
  createdAt?: unknown;
};
