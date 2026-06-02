import type { UserRole } from "@/types/domain";

export function getHomePathForRole(role: UserRole | undefined) {
  switch (role) {
    case "admin":
      return "/admin";
    case "partner":
      return "/agenda";
    case "volunteer":
      return "/caes-rua";
    case "public":
    default:
      return "/mapa";
  }
}
