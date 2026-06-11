"use client";

import { useState } from "react";
import { Crown, Sparkles, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

type UpgradeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName?: string;
  resourceName: "clientes" | "pets" | "agendamentos";
  limit: number;
};

const resourceLabels = {
  clientes: "Clientes (Tutores)",
  pets: "Pets Domésticos",
  agendamentos: "Agendamentos",
};

export function UpgradeDialog({
  isOpen,
  onClose,
  orgId,
  orgName,
  resourceName,
  limit,
}: UpgradeDialogProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useAuth();

  async function handleUpgrade() {
    if (!user || !orgId) return;

    setIsUpgrading(true);
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
      toast.error(err.message || "Falha ao realizar upgrade da organização.");
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      title=""
      onClose={onClose}
    >
      <div className="flex flex-col items-center text-center">
        {/* Animated Premium Badge */}
        <div className="relative mb-6 flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent ring-8 ring-accent/5">
          <Crown className="size-8" strokeWidth={2.3} />
          <Sparkles className="absolute -right-1 -top-1 size-5 text-amber-400 animate-pulse" />
        </div>

        <h3 className="text-xl font-extrabold text-white sm:text-2xl">
          Upgrade para o Plano Pro
        </h3>
        <p className="mt-3 text-sm text-muted max-w-sm leading-relaxed">
          Você atingiu o limite do Plano Gratuito de <strong className="text-white">{limit} {resourceLabels[resourceName]}</strong> para {orgName ? <strong className="text-white">"{orgName}"</strong> : "sua organização"}.
        </p>

        {/* Feature List */}
        <div className="my-6 w-full rounded-lg border border-bd-muted bg-surface-2 p-4 text-left">
          <span className="text-xs font-bold uppercase text-accent tracking-wider block mb-3">
            O que está incluído no Plano Pro:
          </span>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 text-xs text-fg leading-normal">
              <Check className="size-4 shrink-0 text-accent" strokeWidth={3} />
              <span><strong>Clientes e Tutores ilimitados</strong> (cadastre toda a sua base)</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-fg leading-normal">
              <Check className="size-4 shrink-0 text-accent" strokeWidth={3} />
              <span><strong>Pets Domésticos ilimitados</strong> com prontuário clínico</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-fg leading-normal">
              <Check className="size-4 shrink-0 text-accent" strokeWidth={3} />
              <span><strong>Agendamentos ilimitados</strong> sem restrições mensais</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-fg leading-normal">
              <Check className="size-4 shrink-0 text-accent" strokeWidth={3} />
              <span>Exibição destacada como Parceiro no mapa público</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full flex-col gap-2.5">
          <Button
            onClick={() => void handleUpgrade()}
            disabled={isUpgrading}
            variant="primary"
            size="lg"
            className="w-full rounded-md shadow-[0_0_30px_rgba(155,135,255,0.4)] flex items-center justify-center gap-2"
          >
            <span>{isUpgrading ? "Fazendo Upgrade..." : "Fazer Upgrade Imediato"}</span>
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            size="md"
            className="w-full text-muted hover:text-white"
          >
            Permanecer no Plano Gratuito
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
