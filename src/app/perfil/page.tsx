"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { User, Mail, Shield, Check, Crown, Sparkles, Building } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { roleLabels } from "@/config/roles";
import type { Organization } from "@/types/domain";

export default function UserProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOrgsLoading, setIsOrgsLoading] = useState(true);
  const [isUpgradingMap, setIsUpgradingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  // Load user's organizations
  useEffect(() => {
    if (!db || !user || !profile) return;

    setIsOrgsLoading(true);
    let orgsQuery;

    if (profile.role === "admin") {
      orgsQuery = query(collection(db, "organizations"));
    } else if (profile.organizationIds && profile.organizationIds.length > 0) {
      orgsQuery = query(
        collection(db, "organizations"),
        where(documentId(), "in", profile.organizationIds)
      );
    } else {
      setOrganizations([]);
      setIsOrgsLoading(false);
      return;
    }

    return onSnapshot(
      orgsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Organization[];
        setOrganizations(list);
        setIsOrgsLoading(false);
      },
      () => {
        setIsOrgsLoading(false);
      }
    );
  }, [user, profile]);

  async function handleUpgrade(orgId: string) {
    if (!user) return;
    setIsUpgradingMap((prev) => ({ ...prev, [orgId]: true }));
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          userId: user.uid,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erro ao iniciar checkout");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao realizar upgrade.");
    } finally {
      setIsUpgradingMap((prev) => ({ ...prev, [orgId]: false }));
    }
  }

  if (isLoading || isProfileLoading || !user || !profile) {
    return (
      <AppLayout showNavigation>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="size-6 text-accent" /> Meu Perfil
          </h1>
          <p className="mt-2 text-sm text-muted">
            Gerencie suas informações pessoais, visualize suas organizações e compare os planos disponíveis.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column: User Info & Organizations */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Personal Details Card */}
            <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4">
              <div className="flex flex-col items-center text-center border-b border-bd-muted/50 pb-5">
                <div className="relative size-20 rounded-full border border-bd-muted overflow-hidden bg-surface-3 mb-3">
                  {profile.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photoURL} alt={profile.displayName} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted">
                      <User className="size-10" />
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white leading-normal">{profile.displayName}</h2>
                <span className="mt-1.5 inline-block rounded-full border border-accent/20 bg-accent/5 px-3 py-0.5 text-xs font-bold text-accent uppercase tracking-wider">
                  {roleLabels[profile.role] || profile.role}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-sm text-muted">
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate text-white">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted">
                  <Shield className="size-4 shrink-0" />
                  <span className="text-white">UID: <code className="text-xs bg-surface-3 px-1.5 py-0.5 rounded text-placeholder">{profile.id}</code></span>
                </div>
              </div>
            </section>

            {/* Organizations Card */}
            <section className="rounded-lg border border-bd-muted bg-surface p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Building className="size-4 text-accent" /> Minhas Organizações
              </h3>

              {isOrgsLoading ? (
                <p className="text-xs text-muted">Carregando estabelecimentos...</p>
              ) : organizations.length === 0 ? (
                <p className="text-xs text-muted leading-relaxed">
                  Você não está associado a nenhuma organização comercial no momento.
                </p>
              ) : (
                <ul className="space-y-3">
                  {organizations.map((org) => (
                    <li
                      key={org.id}
                      className="flex flex-col gap-2 rounded-md border border-bd-muted bg-surface-3 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate max-w-[70%]">
                          {org.name}
                        </span>
                        {org.plan === "pro" ? (
                          <span className="rounded bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-accent flex items-center gap-1">
                            Pro <Sparkles className="size-3 text-amber-400" />
                          </span>
                        ) : (
                          <span className="rounded bg-muted/10 border border-bd-muted px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-muted">
                            Grátis
                          </span>
                        )}
                      </div>

                      {org.plan !== "pro" && (
                        <Button
                          onClick={() => void handleUpgrade(org.id)}
                          disabled={isUpgradingMap[org.id]}
                          variant="primary"
                          size="sm"
                          className="w-full mt-1 flex items-center justify-center gap-1.5"
                          icon={<Crown className="size-3" />}
                        >
                          {isUpgradingMap[org.id] ? "Processando..." : "Fazer Upgrade"}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right Column: Comparative Pricing Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pricing Section */}
            <section className="grid gap-6 md:grid-cols-2">
              
              {/* Free Plan Card */}
              <div className="rounded-lg border border-bd-muted bg-surface p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold uppercase tracking-wider text-muted">Plano Gratuito</span>
                    <span className="text-xl font-black text-white">R$ 0</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-6">
                    Ideal para testar a plataforma ou para pequenos cuidadores comunitários iniciarem a gestão.
                  </p>
                  
                  <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-3">Limitações do Plano:</span>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-xs text-muted leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>Clientes (Tutores): <strong className="text-white">Até 5</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>Pets Domésticos: <strong className="text-white">Até 5</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>Agendamentos: <strong className="text-white">Até 10</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted/50 line-through leading-normal">
                      <Check className="size-4 text-muted shrink-0 mt-0.5" />
                      <span>Exibir no mapa público do Mundo Pet</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-bd-muted/40">
                  <div className="rounded bg-surface-3 p-3 text-center text-xs font-bold text-muted">
                    Plano Ativo por Padrão
                  </div>
                </div>
              </div>

              {/* Pro Plan Card */}
              <div className="rounded-lg border border-accent bg-surface-2 p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 bg-accent text-accent-contrast text-[0.65rem] font-bold uppercase px-3 py-1 rounded-bl-md flex items-center gap-1">
                  Recomendado <Sparkles className="size-3 text-amber-300" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                      <Crown className="size-4" /> Plano Pro
                    </span>
                    <span className="text-xl font-black text-white">R$ 49,90<span className="text-xs font-normal text-muted">/mês</span></span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-6">
                    Acesso completo e ilimitado para petshops estruturados crescerem e captarem mais clientes na comunidade.
                  </p>
                  
                  <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-3">Vantagens do Plano:</span>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-xs text-fg leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>Clientes (Tutores) <strong className="text-white">Ilimitados</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-fg leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>Pets Domésticos <strong className="text-white">Ilimitados</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-fg leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>Agendamentos <strong className="text-white">Ilimitados</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-fg leading-normal">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span><strong className="text-white">Exibição ativada</strong> no mapa público</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-bd-muted/40">
                  {organizations.some(o => o.plan !== "pro") ? (
                    <Button
                      onClick={() => {
                        const firstFree = organizations.find(o => o.plan !== "pro");
                        if (firstFree) {
                          void handleUpgrade(firstFree.id);
                        }
                      }}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(155,135,255,0.3)]"
                    >
                      <Crown className="size-4" /> Fazer Upgrade das Organizações
                    </Button>
                  ) : (
                    <div className="rounded border border-accent/20 bg-accent/5 p-3 text-center text-xs font-bold text-accent">
                      Todas as suas organizações são Pro!
                    </div>
                  )}
                </div>
              </div>

            </section>
          </div>

        </div>

      </main>
    </AppLayout>
  );
}
