"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import type { User } from "firebase/auth";
import { roleLabels } from "@/config/roles";
import type { AuthenticatedProfile } from "@/types/domain";

type UserSummaryProps = {
  user: User;
  profile: AuthenticatedProfile | null;
  isProfileLoading?: boolean;
};

export function UserSummary({
  user,
  profile,
  isProfileLoading = false,
}: UserSummaryProps) {
  const name = profile?.displayName || user.displayName || "Usuario";
  const email = profile?.email || user.email || "";
  const photoUrl = profile?.photoURL || user.photoURL;
  const roleLabel = profile ? roleLabels[profile.role] : "Perfil pendente";

  return (
    <section className="mb-6 flex items-center gap-3 rounded-lg border border-bd-muted bg-surface px-4 py-3">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="size-11 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="grid size-11 place-items-center rounded-full bg-surface-2 text-accent">
          <UserRound className="size-5" strokeWidth={2.2} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{name}</p>
        {email ? <p className="truncate text-xs text-muted">{email}</p> : null}
      </div>

      <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-status-neutral-border bg-status-neutral-bg px-3 text-xs font-bold text-fg">
        <ShieldCheck className="size-4 text-accent" strokeWidth={2.2} />
        {isProfileLoading ? "Carregando perfil" : roleLabel}
      </div>
    </section>
  );
}
