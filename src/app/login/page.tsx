"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/contexts/auth-context";

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
  const { user, isLoading, isConfigured, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  async function handleGoogleLogin() {
    if (!isConfigured) {
      setError("Configure as variaveis do Firebase antes de fazer login.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.replace("/");
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
        <div className="mb-8 inline-flex items-center gap-2 text-[#9b87ff]">
          <span className="grid size-10 place-items-center rounded-lg bg-[#25252e]">
            <PawPrint className="size-5" strokeWidth={2.3} />
          </span>
          <span className="text-xs font-bold uppercase">Mundo Pet</span>
        </div>

        <section className="rounded-lg border border-[#30313d] bg-[#181920] p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-normal text-white">
              Entrar na agenda
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
              Use sua conta Google para acessar ou criar o usuario
              automaticamente.
            </p>
          </div>

          <div className="space-y-4">
            {error ? (
              <p className="rounded-md border border-[#7f1d1d] bg-[#2a1518] px-3 py-2 text-sm text-[#fecaca]">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isLoading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-md bg-white px-4 text-sm font-bold text-[#181920] transition hover:bg-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid size-5 place-items-center rounded-full border border-[#e4e4e7] text-xs font-black text-[#4285f4]">
                G
              </span>
              {isSubmitting ? "Entrando..." : "Entrar com Google"}
            </button>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
