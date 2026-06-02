import type { DocumentData } from "firebase/firestore";
import type { AuthenticatedProfile, UserRole } from "@/types/domain";

export function profileFromFirestore(
  id: string,
  data: DocumentData,
): AuthenticatedProfile {
  return {
    id,
    displayName: String(data.displayName ?? ""),
    email: String(data.email ?? ""),
    photoURL: data.photoURL ? String(data.photoURL) : undefined,
    role: parseRole(data.role),
    organizationIds: Array.isArray(data.organizationIds)
      ? data.organizationIds.map(String)
      : [],
    isActive: data.isActive === true,
  };
}

function parseRole(role: unknown): UserRole {
  if (
    role === "admin" ||
    role === "partner" ||
    role === "volunteer" ||
    role === "public"
  ) {
    return role;
  }

  return "public";
}
