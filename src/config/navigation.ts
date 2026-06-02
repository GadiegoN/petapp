import {
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  type LucideIcon,
  Map,
  MessageSquareWarning,
  PawPrint,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import type { PermissionAction } from "@/types/domain";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: PermissionAction;
};

export const appNavigation: NavigationItem[] = [
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
    requiredPermission: "manage_appointments",
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    requiredPermission: "manage_commercial_pets",
  },
  {
    label: "Pets domesticos",
    href: "/pets",
    icon: PawPrint,
    requiredPermission: "manage_commercial_pets",
  },
  {
    label: "Caes de rua",
    href: "/caes-rua",
    icon: HeartHandshake,
    requiredPermission: "create_street_dog",
  },
  {
    label: "Pontos de apoio",
    href: "/pontos-apoio",
    icon: Store,
    requiredPermission: "update_support_point",
  },
  {
    label: "Mapa",
    href: "/mapa",
    icon: Map,
    requiredPermission: "view_public_map",
  },
];

export const adminNavigation: NavigationItem[] = [
  {
    label: "Painel",
    href: "/admin",
    icon: ShieldCheck,
    requiredPermission: "manage_all",
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
    requiredPermission: "manage_all",
  },
  {
    label: "Organizacoes",
    href: "/admin/organizacoes",
    icon: Store,
    requiredPermission: "manage_all",
  },
  {
    label: "Aprovacoes",
    href: "/admin/aprovacoes",
    icon: LayoutDashboard,
    requiredPermission: "moderate_content",
  },
  {
    label: "Moderacao",
    href: "/admin/moderacao",
    icon: MessageSquareWarning,
    requiredPermission: "moderate_content",
  },
];
