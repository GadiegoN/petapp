"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  HeartHandshake,
  LogIn,
  LogOut,
  Map,
  PawPrint,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";
import { roleLabels } from "@/config/roles";
import { useAuth } from "@/contexts/auth-context";
import { can } from "@/lib/permissions/roles";
import { Button, buttonClassName } from "@/components/ui/button";
import type { PermissionAction, UserRole } from "@/types/domain";

type RoleNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionAction;
};

const navigationItems: RoleNavigationItem[] = [
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
    permission: "manage_appointments",
  },
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    permission: "manage_all",
  },
  {
    label: "Caes",
    href: "/caes-rua",
    icon: HeartHandshake,
    permission: "create_street_dog",
  },
  {
    label: "Pontos",
    href: "/pontos-apoio",
    icon: Store,
    permission: "create_support_point",
  },
  {
    label: "Mapa",
    href: "/mapa",
    icon: Map,
    permission: "view_public_map",
  },
];

export function RoleNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading, signOut } = useAuth();
  const role: UserRole = profile?.role ?? "public";
  const isAuthenticated = Boolean(user);

  const visibleItems = navigationItems.filter((item) =>
    can(isAuthenticated ? role : "public", item.permission),
  );

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="border-b border-bd-muted bg-surface">
      <div className="mx-auto flex w-full max-w-260 flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/mapa" className="inline-flex items-center gap-2">
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
            {visibleItems.map((item) => {
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
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isAuthenticated ? (
            <Button
              onClick={() => void handleSignOut()}
              variant="ghost"
              size="md"
              icon={<LogOut className="size-4" strokeWidth={2.2} />}
            >
              Sair
            </Button>
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
