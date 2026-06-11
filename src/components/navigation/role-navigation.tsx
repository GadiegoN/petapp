"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  HeartHandshake,
  Home,
  LogIn,
  LogOut,
  Map,
  PawPrint,
  ShieldCheck,
  Store,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { roleLabels } from "@/config/roles";
import { useAuth } from "@/contexts/auth-context";
import { can } from "@/lib/permissions/roles";
import { Button, buttonClassName } from "@/components/ui/button";
import type { PermissionAction, UserRole } from "@/types/domain";

type DirectNavItem = {
  type: "direct";
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionAction;
};

type GroupNavItem = {
  type: "group";
  label: string;
  icon: LucideIcon;
  items: {
    label: string;
    href: string;
    icon: LucideIcon;
    permission: PermissionAction;
  }[];
};

type MenuItem = DirectNavItem | GroupNavItem;

const menuStructure: MenuItem[] = [
  {
    type: "direct",
    label: "Início",
    href: "/",
    icon: Home,
    permission: "view_public_map",
  },
  {
    type: "direct",
    label: "Mapa",
    href: "/mapa",
    icon: Map,
    permission: "view_public_map",
  },
  {
    type: "group",
    label: "Comunidade",
    icon: HeartHandshake,
    items: [
      {
        label: "Cães de Rua",
        href: "/caes-rua",
        icon: HeartHandshake,
        permission: "create_street_dog",
      },
      {
        label: "Pontos de Apoio",
        href: "/pontos-apoio",
        icon: Store,
        permission: "create_support_point",
      },
    ],
  },
  {
    type: "group",
    label: "Comercial",
    icon: Store,
    items: [
      {
        label: "Agenda",
        href: "/agenda",
        icon: CalendarDays,
        permission: "manage_appointments",
      },
      {
        label: "Clientes",
        href: "/clientes",
        icon: Users,
        permission: "manage_commercial_pets",
      },
      {
        label: "Pets",
        href: "/pets",
        icon: PawPrint,
        permission: "manage_commercial_pets",
      },
      {
        label: "Perfil da Org",
        href: "/organizacao/perfil",
        icon: Store,
        permission: "manage_organization",
      },
    ],
  },
  {
    type: "direct",
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    permission: "manage_all",
  },
];

function NavigationDropdown({
  label,
  icon: Icon,
  items,
  pathname,
}: {
  label: string;
  icon: LucideIcon;
  items: { label: string; href: string; icon: LucideIcon }[];
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  const isAnyActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName({
          variant: isAnyActive ? "link" : "ghost",
          size: "md",
        }) + " flex items-center gap-1.5"}
      >
        <Icon className="size-4" strokeWidth={2.2} />
        <span>{label}</span>
        <ChevronDown
          className={`size-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-48 origin-top-left rounded-md border border-bd-muted bg-surface-3 p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent text-accent-contrast font-bold"
                    : "text-fg hover:bg-surface-2"
                }`}
              >
                <ItemIcon className="size-4" strokeWidth={2.2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RoleNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading, signOut } = useAuth();
  const role: UserRole = profile?.role ?? "public";
  const isAuthenticated = Boolean(user);

  const visibleMenu = menuStructure
    .map((item) => {
      if (item.type === "direct") {
        const canAccess = can(isAuthenticated ? role : "public", item.permission);
        return canAccess ? item : null;
      } else {
        const visibleSubItems = item.items.filter((sub) =>
          can(isAuthenticated ? role : "public", sub.permission)
        );
        return visibleSubItems.length > 0
          ? { ...item, items: visibleSubItems }
          : null;
      }
    })
    .filter((item): item is MenuItem => item !== null);

  if (isAuthenticated && role === "public") {
    visibleMenu.push({
      type: "direct",
      label: "Quero Ajudar",
      href: "/solicitar-acesso",
      icon: HeartHandshake,
      permission: "view_public_map",
    });
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="border-b border-bd-muted bg-surface">
      <div className="mx-auto flex w-full max-w-260 flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-lg bg-surface-2 text-accent">
              <PawPrint className="size-5" strokeWidth={2.3} />
            </span>
            <span className="text-xs font-bold uppercase text-accent">
              Mundo Pet
            </span>
          </Link>

          {isAuthenticated ? (
            <span className="rounded-md border border-neutral-border bg-neutral-bg px-2 py-1 text-[0.7rem] font-bold uppercase text-neutral lg:hidden">
              {isProfileLoading ? "Perfil" : roleLabels[role]}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2">
            {visibleMenu.map((item, index) => {
              if (item.type === "direct") {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={buttonClassName({
                      variant: isActive ? "link" : "ghost",
                      size: "md",
                    })}
                  >
                    <Icon className="size-4" strokeWidth={2.2} />
                    <span>{item.label}</span>
                  </Link>
                );
              } else {
                return (
                  <NavigationDropdown
                    key={`group-${index}`}
                    label={item.label}
                    icon={item.icon}
                    items={item.items}
                    pathname={pathname}
                  />
                );
              }
            })}
          </nav>

          {isAuthenticated ? (
            <>
              <Link
                href="/perfil"
                className={buttonClassName({
                  variant: pathname === "/perfil" ? "link" : "ghost",
                  size: "md",
                }) + " flex items-center gap-1.5"}
              >
                <User className="size-4" strokeWidth={2.2} />
                <span>Meu Perfil</span>
              </Link>
              <Button
                onClick={() => void handleSignOut()}
                variant="ghost"
                size="md"
                icon={<LogOut className="size-4" strokeWidth={2.2} />}
              >
                Sair
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className={buttonClassName({ variant: "secondary", size: "md" })}
            >
              <LogIn className="size-4" strokeWidth={2.2} />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
