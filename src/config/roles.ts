import type { UserRole } from "@/types/domain";

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  partner: "Parceiro/Petshop",
  volunteer: "Cuidador/Voluntario",
  public: "Publico",
};
