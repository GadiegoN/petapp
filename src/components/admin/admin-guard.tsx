"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/auth-context";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || isProfileLoading || !user) {
    return (
      <AppLayout>
        <main className="grid min-h-screen place-items-center px-4">
          <p className="text-sm font-medium text-muted">Carregando...</p>
        </main>
      </AppLayout>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <AppLayout>
        <main className="mx-auto grid min-h-screen w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-error bg-error-bg p-5 text-sm leading-6 text-error-light">
            Seu perfil atual nao tem permissao de administrador. Peca para um
            administrador alterar seu papel em `users/{user.uid}`.
          </section>
        </main>
      </AppLayout>
    );
  }

  return children;
}
