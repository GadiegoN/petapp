"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CopyX, X } from "lucide-react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageFrame } from "@/components/admin/admin-page-frame";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  recordStreetDogHistory,
  recordSupportPointHistory,
} from "@/lib/community-history";
import {
  findStreetDogDuplicates,
  findSupportPointDuplicates,
  type DuplicateCandidate,
  type DuplicateSourceItem,
} from "@/lib/duplicates/community-duplicates";
import { db } from "@/lib/firebase";

type ApprovalCollection = "streetDogs" | "supportPoints" | "organizations" | "roleRequests";

type ApprovalItem = {
  id: string;
  collectionName: ApprovalCollection;
  typeLabel: string;
  title: string;
  subtitle: string;
  statusField: "approvalStatus" | "status";
  data: DocumentData;
  duplicates: DuplicateCandidate[];
};

export default function AdminApprovalsPage() {
  const { user } = useAuth();
  const [streetDogs, setStreetDogs] = useState<DuplicateSourceItem[]>([]);
  const [supportPoints, setSupportPoints] = useState<DuplicateSourceItem[]>([]);
  const [organizations, setOrganizations] = useState<DuplicateSourceItem[]>([]);
  const [roleRequests, setRoleRequests] = useState<DuplicateSourceItem[]>([]);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) {
      return;
    }

    const unsubscribers = [
      onSnapshot(query(collection(db, "streetDogs")), (snapshot) => {
        setStreetDogs(
          snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
        );
      }),
      onSnapshot(query(collection(db, "supportPoints")), (snapshot) => {
        setSupportPoints(
          snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
        );
      }),
      onSnapshot(query(collection(db, "organizations")), (snapshot) => {
        setOrganizations(
          snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
        );
      }),
      onSnapshot(query(collection(db, "roleRequests")), (snapshot) => {
        setRoleRequests(
          snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
        );
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const sortedItems = useMemo(() => {
    const dogItems: ApprovalItem[] = streetDogs
      .filter((item) => item.data.approvalStatus === "pending")
      .map((item) => ({
        id: item.id,
        collectionName: "streetDogs",
        typeLabel: "Cao de rua",
        title: String(item.data.nickname || "Sem apelido"),
        subtitle: String(item.data.regionLabel || "Sem regiao"),
        statusField: "approvalStatus",
        data: item.data,
        duplicates: findStreetDogDuplicates(item.id, item.data, streetDogs),
      }));

    const pointItems: ApprovalItem[] = supportPoints
      .filter((item) => item.data.approvalStatus === "pending")
      .map((item) => ({
        id: item.id,
        collectionName: "supportPoints",
        typeLabel: "Ponto de apoio",
        title: String(item.data.name || "Sem nome"),
        subtitle: String(item.data.type || "Sem tipo"),
        statusField: "approvalStatus",
        data: item.data,
        duplicates: findSupportPointDuplicates(
          item.id,
          item.data,
          supportPoints,
        ),
      }));

    const organizationItems: ApprovalItem[] = organizations
      .filter((item) => item.data.status === "pending")
      .map((item) => ({
        id: item.id,
        collectionName: "organizations",
        typeLabel: "Organizacao",
        title: String(item.data.name || "Sem nome"),
        subtitle: String(item.data.type || "Sem tipo"),
        statusField: "status",
        data: item.data,
        duplicates: [],
      }));

    const roleRequestItems: ApprovalItem[] = roleRequests
      .filter((item) => item.data.status === "pending")
      .map((item) => ({
        id: item.id,
        collectionName: "roleRequests",
        typeLabel: "Solicitação de Acesso",
        title: String(item.data.displayName || "Sem nome"),
        subtitle: String(item.data.email || "Sem email"),
        statusField: "status",
        data: item.data,
        duplicates: [],
      }));

    return [...dogItems, ...pointItems, ...organizationItems, ...roleRequestItems].sort(
      (first, second) => first.typeLabel.localeCompare(second.typeLabel),
    );
  }, [organizations, streetDogs, supportPoints, roleRequests]);

  async function handleDecision(item: ApprovalItem, approved: boolean) {
    if (!db || !user) {
      return;
    }

    setSavingId(`${item.collectionName}:${item.id}`);
    try {
      await updateDoc(doc(db, item.collectionName, item.id), {
        [item.statusField]: approved ? "approved" : "rejected",
        reviewedAt: serverTimestamp(),
        reviewedByUserId: user.uid,
        rejectionReason: approved ? "" : "manual_rejection",
        duplicateOfId: "",
      });

      if (item.collectionName === "streetDogs") {
        await recordStreetDogHistory(db, {
          streetDogId: item.id,
          type: approved ? "approved" : "rejected",
          description: approved ? "Cadastro aprovado." : "Cadastro rejeitado.",
          createdByUserId: user.uid,
          isPublic: approved,
        });
      }

      if (item.collectionName === "supportPoints") {
        await recordSupportPointHistory(db, {
          supportPointId: item.id,
          type: approved ? "approved" : "rejected",
          description: approved ? "Cadastro aprovado." : "Cadastro rejeitado.",
          createdByUserId: user.uid,
          isPublic: approved,
        });
      }

      if (item.collectionName === "organizations") {
        const ownerUserId = item.data.ownerUserId;
        if (ownerUserId) {
          if (approved) {
            await updateDoc(doc(db, "users", ownerUserId), {
              role: "partner",
              organizationIds: arrayUnion(item.id),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(doc(db, "users", ownerUserId), {
              role: "public",
              organizationIds: arrayRemove(item.id),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      if (item.collectionName === "roleRequests" && approved) {
        const reqUserId = item.data.userId;
        if (reqUserId) {
          await updateDoc(doc(db, "users", reqUserId), {
            role: "volunteer",
            updatedAt: serverTimestamp(),
          });
        }
      }

      setError("");
    } catch {
      setError("Nao foi possivel atualizar a aprovacao.");
    } finally {
      setSavingId("");
    }
  }

  async function handleDuplicate(item: ApprovalItem, duplicateId: string) {
    if (!db || !user) {
      return;
    }

    setSavingId(`${item.collectionName}:${item.id}`);
    try {
      await updateDoc(doc(db, item.collectionName, item.id), {
        [item.statusField]: "rejected",
        reviewedAt: serverTimestamp(),
        reviewedByUserId: user.uid,
        rejectionReason: "duplicate",
        duplicateOfId: duplicateId,
      });

      if (item.collectionName === "streetDogs") {
        await recordStreetDogHistory(db, {
          streetDogId: item.id,
          type: "duplicated",
          description: `Cadastro marcado como duplicado de ${duplicateId}.`,
          createdByUserId: user.uid,
          isPublic: false,
        });
      }

      if (item.collectionName === "supportPoints") {
        await recordSupportPointHistory(db, {
          supportPointId: item.id,
          type: "duplicated",
          description: `Cadastro marcado como duplicado de ${duplicateId}.`,
          createdByUserId: user.uid,
          isPublic: false,
        });
      }

      setError("");
    } catch {
      setError("Nao foi possivel marcar como duplicado.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <AdminPageFrame
      title="Aprovacoes"
      description="Revise cadastros pendentes, confira possiveis duplicados e decida antes de liberar exibicao publica ou uso operacional."
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-error bg-error-bg px-4 py-3 text-sm text-error-light">
          {error}
        </p>
      ) : null}

      {sortedItems.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
          <ul>
            {sortedItems.map((item) => {
              const key = `${item.collectionName}:${item.id}`;
              const isSaving = savingId === key;

              return (
                <li
                  key={key}
                  className="grid gap-4 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-start"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={item.typeLabel} />
                      <AdminStatusBadge label="Pendente" tone="warning" />
                      {item.duplicates.length > 0 ? (
                        <AdminStatusBadge
                          label={`${item.duplicates.length} possivel duplicado`}
                          tone="danger"
                        />
                      ) : null}
                    </div>
                    <p className="truncate text-sm font-bold text-white">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {item.subtitle}
                    </p>

                    {/* Detalhes completos do cadastro pendente para moderação consciente */}
                    <div className="mt-3 rounded-md border border-bd-muted bg-surface-3 p-3 text-xs leading-5 space-y-2 text-muted max-w-2xl">
                      <p className="font-bold text-fg uppercase tracking-wider text-[0.7rem] border-b border-bd-muted pb-1 mb-1">
                        Dados Enviados para Revisão:
                      </p>
                      {item.collectionName === "streetDogs" && (
                        <div className="grid gap-2 sm:grid-cols-2 text-fg">
                          <p><strong className="text-white">Apelido:</strong> {item.data.nickname || "Sem apelido"}</p>
                          <p><strong className="text-white">Região:</strong> {item.data.regionLabel || "Não informada"}</p>
                          <p><strong className="text-white">Sexo:</strong> {item.data.sex === "male" ? "Macho" : item.data.sex === "female" ? "Fêmea" : "Desconhecido"}</p>
                          <p><strong className="text-white">Porte:</strong> {item.data.size === "small" ? "Pequeno" : item.data.size === "medium" ? "Médio" : item.data.size === "large" ? "Grande" : item.data.size === "giant" ? "Gigante" : "Desconhecido"}</p>
                          <p><strong className="text-white">Raça aproximada:</strong> {item.data.approximateBreed || "SRD"}</p>
                          <p><strong className="text-white">Cor predominante:</strong> {item.data.color || "Não informada"}</p>
                          <p><strong className="text-white">Temperamento:</strong> {item.data.temperament || "Não informado"}</p>
                          <p><strong className="text-white">Vacinação:</strong> {item.data.vaccination === "yes" ? "Vacinado" : item.data.vaccination === "no" ? "Não vacinado" : "Desconhecido"}</p>
                          <p><strong className="text-white">Castrado:</strong> {item.data.neutering === "yes" ? "Sim" : item.data.neutering === "no" ? "Não" : "Desconhecido"}</p>
                          {item.data.notes && <p className="col-span-2"><strong className="text-white">Observações:</strong> {item.data.notes}</p>}
                          {item.data.photoUrl && (
                            <div className="col-span-2 mt-2">
                              <strong className="block text-white mb-1">Foto Enviada:</strong>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.data.photoUrl} alt="Foto do cão" className="max-h-40 rounded object-cover border border-bd-muted" />
                            </div>
                          )}
                        </div>
                      )}
                      {item.collectionName === "supportPoints" && (
                        <div className="grid gap-2 sm:grid-cols-2 text-fg">
                          <p><strong className="text-white">Nome do Ponto:</strong> {item.data.name || "Sem nome"}</p>
                          <p><strong className="text-white">Tipo:</strong> {item.data.type === "donation_point" ? "Ponto de Doação" : item.data.type === "petshop" ? "Petshop Parceiro" : item.data.type === "commerce" ? "Comércio Solidário" : item.data.type === "ngo" ? "ONG / Protetora" : "Outro"}</p>
                          <p><strong className="text-white">Ração disponível:</strong> {item.data.foodAvailable ? "Sim" : "Não"}</p>
                          <p><strong className="text-white">Água disponível:</strong> {item.data.waterAvailable ? "Sim" : "Não"}</p>
                          <p><strong className="text-white">Precisa de reposição:</strong> {item.data.needsRestock ? "Sim" : "Não"}</p>
                          <p><strong className="text-white">Horário de funcionamento:</strong> {item.data.commonHours || "Não informado"}</p>
                          <p><strong className="text-white">Responsável:</strong> {item.data.responsibleName || "Não informado"}</p>
                          <p><strong className="text-white">Contato:</strong> {item.data.responsibleContact || "Não informado"}</p>
                          {item.data.notes && <p className="col-span-2"><strong className="text-white">Observações:</strong> {item.data.notes}</p>}
                        </div>
                      )}
                      {item.collectionName === "organizations" && (
                        <div className="grid gap-2 sm:grid-cols-2 text-fg">
                          <p><strong className="text-white">Nome da Organização:</strong> {item.data.name || "Sem nome"}</p>
                          <p><strong className="text-white">Tipo:</strong> {item.data.type}</p>
                          <p><strong className="text-white">Documento (CNPJ/CPF):</strong> {item.data.document || "Não informado"}</p>
                          <p><strong className="text-white">E-mail:</strong> {item.data.email || "Não informado"}</p>
                          <p><strong className="text-white">Telefone:</strong> {item.data.phone || "Não informado"}</p>
                          <p><strong className="text-white">Parceiro Público:</strong> {item.data.isPublicPartner ? "Sim" : "Não"}</p>
                          {item.data.address && (
                            <p className="col-span-2"><strong className="text-white">Endereço:</strong> {item.data.address.street}, {item.data.address.number} - {item.data.address.district}, {item.data.address.city}/{item.data.address.state}</p>
                          )}
                          {item.data.notes && (
                            <p className="col-span-2"><strong className="text-white">Nota:</strong> {item.data.notes}</p>
                          )}
                        </div>
                      )}
                      {item.collectionName === "roleRequests" && (
                        <div className="grid gap-2 sm:grid-cols-2 text-fg">
                          <p><strong className="text-white">Nome do Candidato:</strong> {item.data.displayName || "Não informado"}</p>
                          <p><strong className="text-white">E-mail:</strong> {item.data.email || "Não informado"}</p>
                          <p><strong className="text-white">Telefone:</strong> {item.data.phone || "Não informado"}</p>
                          <p><strong className="text-white">Região de Atuação:</strong> {item.data.region || "Não informada"}</p>
                          {item.data.motivation && (
                            <p className="col-span-2"><strong className="text-white">Motivação:</strong> {item.data.motivation}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {item.duplicates.length > 0 ? (
                      <DuplicateList
                        item={item}
                        isSaving={isSaving}
                        onDuplicate={handleDuplicate}
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isSaving}
                      onClick={() => void handleDecision(item, true)}
                      variant="success"
                      size="md"
                      icon={<Check className="size-4" strokeWidth={2.4} />}
                    >
                      Aprovar
                    </Button>
                    <Button
                      disabled={isSaving}
                      onClick={() => void handleDecision(item, false)}
                      variant="danger"
                      size="md"
                      icon={<X className="size-4" strokeWidth={2.4} />}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <AdminEmptyState
          title="Nada pendente"
          description="Caes, pontos e organizacoes pendentes de aprovacao aparecerao aqui automaticamente."
        />
      )}
    </AdminPageFrame>
  );
}

function DuplicateList({
  item,
  isSaving,
  onDuplicate,
}: {
  item: ApprovalItem;
  isSaving: boolean;
  onDuplicate: (item: ApprovalItem, duplicateId: string) => Promise<void>;
}) {
  return (
    <div className="mt-4 rounded-lg border border-warning-border bg-warning-bg/40 p-3">
      <p className="text-xs font-bold uppercase text-warning">
        Possiveis duplicados
      </p>
      <ul className="mt-3 space-y-2">
        {item.duplicates.map((duplicate) => (
          <li
            key={duplicate.id}
            className="grid gap-3 rounded-md border border-bd-muted bg-surface-3 p-3 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {duplicate.title}
              </p>
              <p className="truncate text-xs text-muted">
                {duplicate.detail || `Score ${duplicate.score}`}
              </p>
              <p className="mt-1 text-xs text-warning">
                {duplicate.reasons.join(", ")}
              </p>
            </div>
            <Button
              disabled={isSaving}
              onClick={() => void onDuplicate(item, duplicate.id)}
              variant="warning"
              size="sm"
              icon={<CopyX className="size-4" strokeWidth={2.3} />}
            >
              Duplicado
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
