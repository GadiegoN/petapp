"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading, signOut } = useAuth();

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
      <AppLayout showNavigation>
        <main className="mx-auto flex min-h-[75vh] w-full max-w-md flex-col justify-center px-4 py-12 text-center">
          <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full bg-error-bg/60 border border-error/40 text-error-light mx-auto shadow-lg shadow-error/10">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Acesso Restrito
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Seu perfil atual não possui permissão de administrador. Peça para um administrador alterar seu papel em <code className="text-accent">users/{user.uid}</code>.
          </p>
          
          <div className="mt-6 rounded-lg border border-bd-muted bg-surface-3 p-3 text-xs text-placeholder font-mono select-all">
            UID: {user.uid}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => router.push("/")}
              variant="primary"
              size="md"
              icon={<ArrowLeft className="size-4" />}
            >
              Voltar para o Início
            </Button>
            <Button
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              variant="secondary"
              size="md"
              icon={<LogOut className="size-4" />}
            >
              Sair da Conta
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }

  return children;
}
