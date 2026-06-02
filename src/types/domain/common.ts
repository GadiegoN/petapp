export type EntityStatus = "pending" | "approved" | "rejected" | "suspended";

export type Visibility = "public" | "restricted" | "private";

export type GeoPointValue = {
  latitude: number;
  longitude: number;
};

export type Address = {
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  complement?: string;
};

export type TimestampFields = {
  createdAt?: unknown;
  updatedAt?: unknown;
};
