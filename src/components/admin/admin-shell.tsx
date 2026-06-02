"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSummary } from "@/components/auth/user-summary";
import { adminNavigation } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  const pathname = usePathname();
  const { user, profile, isProfileLoading } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-260 flex-col px-4 py-6 sm:px-6">
      <UserSummary
        user={user}
        profile={profile}
        isProfileLoading={isProfileLoading}
      />

      <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-bd-muted pb-3">
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                isActive
                  ? "bg-accent text-accent-contrast"
                  : "bg-surface-3 text-fg hover:bg-surface-2"
              }`}
            >
              <Icon className="size-4" strokeWidth={2.2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="pb-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 max-w-180 text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
