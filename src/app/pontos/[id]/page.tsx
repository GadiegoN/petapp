"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Calendar, Heart, MapPin, Phone, User } from "lucide-react";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { db } from "@/lib/firebase";
import type { SupportPoint, SupportPointUpdate } from "@/types/domain";

const typeLabels: Record<string, string> = {
  petshop: "Petshop Parceiro",
  commerce: "Comércio Solidário",
  resident: "Morador Voluntário",
  ngo: "ONG / Protetora",
  authorized_public_place: "Local Público Autorizado",
  donation_point: "Ponto de Doação",
};

const updateTypeLabels: Record<string, string> = {
  food_refill: "Reposição de Ração",
  water_refill: "Reposição de Água",
  stock_empty: "Estoque Vazio",
  maintenance: "Manutenção",
  note: "Observação",
  created: "Cadastro Criado",
  edited: "Cadastro Atualizado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  duplicated: "Duplicado",
};

const updateTypeTones: Record<string, string> = {
  food_refill: "border-accent bg-accent/10 text-accent",
  water_refill: "border-blue-400 bg-blue-500/10 text-blue-300",
  stock_empty: "border-error bg-error-bg text-error-light",
  maintenance: "border-warning-border bg-warning-bg text-warning",
  note: "border-bd-muted bg-surface-3 text-muted",
  created: "border-bd-muted bg-surface-3 text-muted",
  edited: "border-bd-muted bg-surface-3 text-muted",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export default function PublicSupportPointPage() {
  const params = useParams<{ id: string }>();
  const [point, setPoint] = useState<SupportPoint | null>(null);
  const [updates, setUpdates] = useState<SupportPointUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPoint() {
      if (!db || !params.id) {
        setIsLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "supportPoints", params.id));

        if (!snapshot.exists()) {
          setPoint(null);
          setError("Ponto de apoio nao encontrado ou nao disponivel publicamente.");
          return;
        }

        const data = snapshot.data();

        if (
          data.visibility !== "public" ||
          data.approvalStatus !== "approved"
        ) {
          setPoint(null);
          setError("Ponto de apoio nao encontrado ou nao disponivel publicamente.");
          return;
        }

        setPoint({ id: snapshot.id, ...data } as SupportPoint);
        setError("");
      } catch {
        setPoint(null);
        setError("Nao foi possivel carregar o cadastro publico do ponto.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPoint();
  }, [params.id]);

  useEffect(() => {
    if (!db || !params.id) {
      return;
    }

    const updatesQuery = query(
      collection(db, "supportPointUpdates"),
      where("supportPointId", "==", params.id)
    );

    return onSnapshot(
      updatesQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              supportPointId: String(data.supportPointId || ""),
              type: data.type || "note",
              description: String(data.description || ""),
              createdByUserId: String(data.createdByUserId || ""),
              createdAt: data.createdAt,
            } as SupportPointUpdate;
          })
          .sort((a, b) => {
            // Sort by createdAt timestamp if available, otherwise by id
            const aTime = a.createdAt && typeof a.createdAt === "object" && "seconds" in a.createdAt ? (a.createdAt as { seconds: number }).seconds : 0;
            const bTime = b.createdAt && typeof b.createdAt === "object" && "seconds" in b.createdAt ? (b.createdAt as { seconds: number }).seconds : 0;
            return bTime - aTime;
          });
        setUpdates(list);
      },
      () => {
        // Silently handle update timeline load failures
      }
    );
  }, [params.id]);

  function formatTime(timestamp: unknown) {
    if (!timestamp || typeof timestamp !== "object" || !("seconds" in timestamp)) {
      return "Recente";
    }
    const date = new Date((timestamp as { seconds: number }).seconds * 1000);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <PublicPageShell
      title="Ponto de Apoio"
      description="Veja a disponibilidade de água, ração e o histórico operacional deste ponto comunitário."
    >
      {isLoading ? (
        <p className="rounded-lg border border-bd-muted bg-surface px-4 py-5 text-sm text-muted">
          Carregando cadastro...
        </p>
      ) : point ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Main info card */}
          <div className="space-y-6">
            <section className="rounded-lg border border-bd-muted bg-surface p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-md border border-neutral-border bg-neutral-bg px-2.5 py-0.5 text-xs font-bold uppercase text-neutral">
                  {typeLabels[point.type] || point.type}
                </span>
                {point.needsRestock && (
                  <span className="rounded-md border border-warning-border bg-warning-bg px-2.5 py-0.5 text-xs font-bold uppercase text-warning">
                    Precisa de Reposição
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white">{point.name}</h2>
              {point.notes && (
                <p className="mt-3 text-sm leading-6 text-muted border-t border-bd-muted/50 pt-3">
                  {point.notes}
                </p>
              )}

              {/* Status indicators */}
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-bd-muted/50 pt-5">
                <div className={`rounded-lg border p-4 text-center ${
                  point.foodAvailable 
                    ? "border-accent/40 bg-accent/5 text-accent" 
                    : "border-bd-muted bg-surface-2 text-muted"
                }`}>
                  <p className="text-xs font-bold uppercase">Ração</p>
                  <p className="mt-1.5 text-base font-black">
                    {point.foodAvailable ? "Disponível" : "Sem Ração"}
                  </p>
                </div>

                <div className={`rounded-lg border p-4 text-center ${
                  point.waterAvailable 
                    ? "border-blue-500/40 bg-blue-500/5 text-blue-300" 
                    : "border-bd-muted bg-surface-2 text-muted"
                }`}>
                  <p className="text-xs font-bold uppercase">Água</p>
                  <p className="mt-1.5 text-base font-black">
                    {point.waterAvailable ? "Disponível" : "Sem Água"}
                  </p>
                </div>
              </div>
            </section>

            {/* Timeline updates */}
            <section className="rounded-lg border border-bd-muted bg-surface p-5 sm:p-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6 border-b border-bd-muted/50 pb-3">
                <Heart className="size-5 text-accent" /> Histórico Operacional
              </h3>

              {updates.length > 0 ? (
                <div className="relative border-l border-bd-muted/70 pl-5 ml-2.5 space-y-6">
                  {updates.map((update) => (
                    <div key={update.id} className="relative">
                      {/* Node circle */}
                      <span className="absolute -left-8 top-1.5 flex size-4 items-center justify-center rounded-full bg-surface border-2 border-accent" />

                      <div className="rounded-lg border border-bd-muted bg-surface-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bd-muted/40 pb-2 mb-2">
                          <span className={`rounded-md border px-2 py-0.5 text-[0.7rem] font-bold uppercase ${
                            updateTypeTones[update.type] || updateTypeTones.note
                          }`}>
                            {updateTypeLabels[update.type] || update.type}
                          </span>
                          <span className="text-xs text-muted flex items-center gap-1 font-bold">
                            <Calendar className="size-3.5" /> {formatTime(update.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-white whitespace-pre-wrap">
                          {update.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted">
                  Nenhuma atualização operacional registrada neste ponto de apoio.
                </div>
              )}
            </section>
          </div>

          {/* Details column */}
          <div className="space-y-6">
            <section className="rounded-lg border border-bd-muted bg-surface p-5 sm:p-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-bd-muted/50 pb-3 mb-4">
                <MapPin className="size-5 text-accent" /> Informações do Local
              </h3>

              <div className="space-y-4 text-sm text-fg">
                {point.address?.city && (
                  <div>
                    <span className="block text-xs font-bold uppercase text-muted">Endereço</span>
                    <p className="mt-1 text-white">
                      {point.address.street}, {point.address.number}
                    </p>
                    <p className="text-muted">
                      {point.address.district} - {point.address.city}/{point.address.state}
                    </p>
                    {point.address.complement && (
                      <p className="text-xs text-placeholder">Complemento: {point.address.complement}</p>
                    )}
                  </div>
                )}

                {point.commonHours && (
                  <div>
                    <span className="block text-xs font-bold uppercase text-muted">Horário de Funcionamento</span>
                    <p className="mt-1 text-white">{point.commonHours}</p>
                  </div>
                )}

                {point.responsibleName && (
                  <div className="border-t border-bd-muted/50 pt-3">
                    <span className="block text-xs font-bold uppercase text-muted flex items-center gap-1">
                      <User className="size-3.5" /> Responsável
                    </span>
                    <p className="mt-1 text-white font-bold">{point.responsibleName}</p>
                    {point.responsibleContact && (
                      <p className="mt-1 text-muted flex items-center gap-1">
                        <Phone className="size-3.5" /> {point.responsibleContact}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      ) : (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-4 py-5 text-sm text-danger">
          {error || "Cadastro nao encontrado."}
        </p>
      )}
    </PublicPageShell>
  );
}
