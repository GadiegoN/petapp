export type UserRole = "admin" | "partner" | "volunteer" | "public";

export type PermissionAction =
  | "view_public_map"
  | "manage_all"
  | "moderate_content"
  | "manage_organization"
  | "manage_appointments"
  | "manage_commercial_pets"
  | "create_street_dog"
  | "update_street_dog"
  | "create_support_point"
  | "update_support_point"
  | "manage_sponsorships";

export type AuthenticatedProfile = {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  organizationIds: string[];
  isActive: boolean;
};
