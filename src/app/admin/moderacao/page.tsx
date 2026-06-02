"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageFrame } from "@/components/admin/admin-page-frame";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { db } from "@/lib/firebase";

type ModerationItem = {
  id: string;
  collectionName: string;
  typeLabel: string;
  description: string;
  createdByUserId: string;
  isPublic?: boolean;
};

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);

  useEffect(() => {
    if (!db) {
      return;
    }

    const unsubscribers = [
      onSnapshot(query(collection(db, "streetDogUpdates")), (snapshot) => {
        setItems((current) => [
          ...current.filter(
            (item) => item.collectionName !== "streetDogUpdates",
          ),
          ...snapshot.docs.map((item) => ({
            id: item.id,
            collectionName: "streetDogUpdates",
            typeLabel: String(item.data().type || "Atualizacao de cao"),
            description: String(item.data().description || "Sem descricao"),
            createdByUserId: String(item.data().createdByUserId || ""),
            isPublic: item.data().isPublic === true,
          })),
        ]);
      }),
      onSnapshot(query(collection(db, "supportPointUpdates")), (snapshot) => {
        setItems((current) => [
          ...current.filter(
            (item) => item.collectionName !== "supportPointUpdates",
          ),
          ...snapshot.docs.map((item) => ({
            id: item.id,
            collectionName: "supportPointUpdates",
            typeLabel: String(item.data().type || "Atualizacao de ponto"),
            description: String(item.data().description || "Sem descricao"),
            createdByUserId: String(item.data().createdByUserId || ""),
          })),
        ]);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((first, second) =>
        first.typeLabel.localeCompare(second.typeLabel),
      ),
    [items],
  );

  return (
    <AdminPageFrame
      title="Moderacao"
      description="Acompanhe atualizacoes de voluntarios e parceiros para revisar conteudo publicado no historico comunitario."
    >
      {sortedItems.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
          <ul>
            {sortedItems.map((item) => (
              <li
                key={`${item.collectionName}:${item.id}`}
                className="grid gap-3 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <AdminStatusBadge label={item.typeLabel} />
                    {typeof item.isPublic === "boolean" ? (
                      <AdminStatusBadge
                        label={item.isPublic ? "Publico" : "Restrito"}
                        tone={item.isPublic ? "success" : "neutral"}
                      />
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-sm font-bold leading-6 text-white">
                    {item.description}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    Criado por {item.createdByUserId || "usuario desconhecido"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <AdminEmptyState
          title="Nenhuma atualizacao para revisar"
          description="Registros de alimentacao, avistamentos e observacoes aparecerao aqui quando forem criados."
        />
      )}
    </AdminPageFrame>
  );
}
