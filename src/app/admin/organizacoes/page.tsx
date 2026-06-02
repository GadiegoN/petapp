"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  AdminOrganizationForm,
  type AdminOrganizationFormData,
} from "@/components/admin/forms/admin-organization-form";
import { AdminPageFrame } from "@/components/admin/admin-page-frame";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";

type OrganizationRow = AdminOrganizationFormData & {
  id: string;
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    return onSnapshot(
      query(collection(db, "organizations")),
      (snapshot) => {
        setOrganizations(
          snapshot.docs.map((item) => {
            const data = item.data();

            return {
              id: item.id,
              name: String(data.name || ""),
              type: String(data.type || "petshop"),
              document: String(data.document || ""),
              phone: String(data.phone || ""),
              email: String(data.email || ""),
              ownerUserId: String(data.ownerUserId || ""),
              status: String(data.status || "pending"),
              isPublicPartner: data.isPublicPartner === true,
            };
          }),
        );
        setError("");
        setIsLoading(false);
      },
      () => {
        setError("Nao foi possivel carregar as organizacoes.");
        setIsLoading(false);
      },
    );
  }, []);

  const sortedOrganizations = useMemo(
    () =>
      [...organizations].sort((first, second) =>
        first.name.localeCompare(second.name),
      ),
    [organizations],
  );

  async function handleSave(data: AdminOrganizationFormData) {
    if (!db) {
      return;
    }

    const payload = {
      name: data.name.trim(),
      type: data.type,
      document: data.document.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      ownerUserId: data.ownerUserId.trim(),
      memberUserIds: [data.ownerUserId.trim()].filter(Boolean),
      status: data.status,
      isPublicPartner: data.isPublicPartner,
      updatedAt: serverTimestamp(),
    };

    setIsSaving(true);
    try {
      if (editingOrganization) {
        await updateDoc(
          doc(db, "organizations", editingOrganization.id),
          payload,
        );
      } else {
        await addDoc(collection(db, "organizations"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setEditingOrganization(null);
      setError("");
    } catch {
      setError("Nao foi possivel salvar a organizacao.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db) {
      return;
    }

    try {
      await deleteDoc(doc(db, "organizations", id));
      setError("");
    } catch {
      setError("Nao foi possivel excluir a organizacao.");
    }
  }

  return (
    <AdminPageFrame
      title="Organizacoes"
      description="Cadastre e gerencie petshops, ONGs, comercios, grupos comunitarios e parceiros."
    >
      <div className="mb-5">
        <AdminOrganizationForm
          initialData={editingOrganization}
          isSaving={isSaving}
          onCancel={
            editingOrganization ? () => setEditingOrganization(null) : undefined
          }
          onSubmit={handleSave}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-error bg-error-bg px-4 py-3 text-sm text-error-light">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
        <div className="grid grid-cols-[1.2fr_0.7fr_1fr_0.7fr_auto] gap-3 border-b border-bd-muted px-4 py-3 text-xs font-bold uppercase text-muted max-lg:hidden">
          <span>Organizacao</span>
          <span>Tipo</span>
          <span>Contato</span>
          <span>Status</span>
          <span>Acoes</span>
        </div>

        {isLoading ? (
          <p className="px-4 py-5 text-sm text-muted">
            Carregando organizacoes...
          </p>
        ) : sortedOrganizations.length > 0 ? (
          <ul>
            {sortedOrganizations.map((organization) => (
              <li
                key={organization.id}
                className="grid gap-3 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 lg:grid-cols-[1.2fr_0.7fr_1fr_0.7fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {organization.name || "Sem nome"}
                  </p>
                  {organization.isPublicPartner ? (
                    <p className="mt-1 text-xs text-muted">Parceiro publico</p>
                  ) : null}
                </div>
                <span className="text-sm text-fg">{organization.type}</span>
                <span className="truncate text-sm text-muted">
                  {organization.email || organization.phone || "Sem contato"}
                </span>
                <AdminStatusBadge
                  label={organization.status}
                  tone={getStatusTone(organization.status)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingOrganization(organization)}
                    variant="icon"
                    size="icon"
                    aria-label="Editar organizacao"
                    icon={<Pencil className="size-4" strokeWidth={2.2} />}
                  >
                  </Button>
                  <Button
                    onClick={() => void handleDelete(organization.id)}
                    variant="danger"
                    size="icon"
                    aria-label="Excluir organizacao"
                    icon={<Trash2 className="size-4" strokeWidth={2.2} />}
                  >
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <AdminEmptyState
              title="Nenhuma organizacao encontrada"
              description="Use o formulario acima para criar o primeiro parceiro, petshop ou grupo comunitario."
            />
          </div>
        )}
      </section>
    </AdminPageFrame>
  );
}

function getStatusTone(status: string) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected" || status === "suspended") {
    return "danger";
  }

  return "warning";
}
