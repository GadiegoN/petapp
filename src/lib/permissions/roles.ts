import type { PermissionAction, UserRole } from "@/types/domain";

const rolePermissions: Record<UserRole, PermissionAction[]> = {
  admin: [
    "view_public_map",
    "manage_all",
    "moderate_content",
    "manage_organization",
    "manage_appointments",
    "manage_commercial_pets",
    "create_street_dog",
    "update_street_dog",
    "create_support_point",
    "update_support_point",
    "manage_sponsorships",
  ],
  partner: [
    "view_public_map",
    "manage_organization",
    "manage_appointments",
    "manage_commercial_pets",
    "create_street_dog",
    "update_street_dog",
    "create_support_point",
    "update_support_point",
  ],
  volunteer: [
    "view_public_map",
    "create_street_dog",
    "update_street_dog",
    "create_support_point",
    "update_support_point",
  ],
  public: ["view_public_map"],
};

export function can(role: UserRole | undefined, action: PermissionAction) {
  if (!role) {
    return action === "view_public_map";
  }

  return rolePermissions[role].includes(action);
}

export function getRolePermissions(role: UserRole) {
  return rolePermissions[role];
}
