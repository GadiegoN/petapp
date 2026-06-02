"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getHomePathForRole } from "@/lib/permissions/role-home";

function getAuthErrorMessage(code?: string) {
  switch (code) {
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    case "auth/invalid-api-key":
      return "A API key do Firebase esta invalida.";
    case "auth/invalid-app-credential":
      return "As credenciais do app Firebase estao invalidas.";
    case "auth/operation-not-allowed":
      return "Ative o provedor Google no Firebase Authentication.";
    case "auth/unauthorized-domain":
      return "Este dominio nao esta autorizado no Firebase Authentication.";
    case "auth/popup-closed-by-user":
      return "Login cancelado antes da conclusao.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela de login do Google.";
    case "auth/account-exists-with-different-credential":
      return "Este email ja esta vinculado a outro metodo de login.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    default:
      return "Nao foi possivel entrar com Google. Tente novamente.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    profile,
    isLoading,
    isProfileLoading,
    isConfigured,
    signInWithGoogle,
  } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isProfileLoading && user) {
      router.replace(getHomePathForRole(profile?.role));
    }
  }, [isLoading, isProfileLoading, profile?.role, router, user]);

  async function handleGoogleLogin() {
    if (!isConfigured) {
      setError("Configure as variaveis do Firebase antes de fazer login.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (loginError) {
      const code =
        loginError && typeof loginError === "object" && "code" in loginError
          ? String(loginError.code)
          : undefined;
      setError(
        code
          ? `${getAuthErrorMessage(code)} Codigo: ${code}`
          : getAuthErrorMessage(),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <main className="mx-auto flex min-h-screen w-full max-w-110 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 inline-flex items-center gap-2 text-accent">
          <span className="grid size-10 place-items-center rounded-lg bg-surface-2">
            <PawPrint className="size-5" strokeWidth={2.3} />
          </span>
          <span className="text-xs font-bold uppercase">Mundo Pet</span>
        </div>

        <section className="rounded-lg border border-bd-muted bg-surface p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-normal text-white">
              Entrar na plataforma
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use sua conta Google para acessar ou criar o usuario
              automaticamente.
            </p>
          </div>

          <div className="space-y-4">
            {error ? (
              <p className="rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error-light">
                {error}
              </p>
            ) : null}

            <Button
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isLoading}
              variant="outline"
              size="lg"
              className="w-full border-neutral bg-white text-surface hover:bg-surface-light hover:text-surface"
              icon={
                <span className="grid size-5 place-items-center rounded-full border border-neutral text-xs font-black text-google">
                  G
                </span>
              }
            >
              {isSubmitting ? "Entrando..." : "Entrar com Google"}
            </Button>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
