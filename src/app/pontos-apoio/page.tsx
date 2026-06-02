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
import { toast } from "sonner";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  SupportPointSubmissionForm,
  type SupportPointSubmissionFormData,
} from "@/components/community/support-point-submission-form";
import { AppLayout } from "@/components/app-layout";
import { UserSummary } from "@/components/auth/user-summary";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  findSupportPointDuplicates,
  type DuplicateSourceItem,
} from "@/lib/duplicates/community-duplicates";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";

type SupportPointRow = SupportPointSubmissionFormData & {
  id: string;
  approvalStatus: string;
  visibility: string;
};

export default function SupportPointsPage() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const [points, setPoints] = useState<DuplicateSourceItem[]>([]);
  const [draftPoint, setDraftPoint] =
    useState<SupportPointSubmissionFormData | null>(null);
  const [editingPoint, setEditingPoint] = useState<SupportPointRow | null>(null);
  const [isPointsLoading, setIsPointsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !user) {
      setPoints([]);
      setIsPointsLoading(false);
      return;
    }

    return onSnapshot(
      query(collection(db, "supportPoints")),
      (snapshot) => {
        setPoints(
          snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
        );
        setError("");
        setIsPointsLoading(false);
      },
      () => {
        setError("Nao foi possivel carregar seus pontos de apoio.");
        setIsPointsLoading(false);
      },
    );
  }, [user]);

  const sortedPoints = useMemo(
    () =>
      points
        .filter(
          (point) =>
            profile?.role === "admin" ||
            point.data.createdByUserId === user?.uid,
        )
        .map((point) => supportPointRowFromSource(point))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [points, profile?.role, user?.uid],
  );

  const duplicateCandidates = useMemo(() => {
    if (!draftPoint) {
      return [];
    }

    return findSupportPointDuplicates(
      editingPoint?.id ?? "",
      supportPointDraftToData(draftPoint),
      points,
    );
  }, [draftPoint, editingPoint?.id, points]);

  const editingPointInitialData = useMemo(
    () => (editingPoint ? supportPointRowToFormData(editingPoint) : null),
    [editingPoint],
  );

  async function handleSave(data: SupportPointSubmissionFormData) {
    if (!db || !user || !can(profile?.role, "create_support_point")) {
      return;
    }

    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Informe latitude e longitude validas.");
      return;
    }

    const payload = {
      name: data.name.trim(),
      type: data.type,
      location: { latitude, longitude },
      foodAvailable: data.foodAvailable,
      waterAvailable: data.waterAvailable,
      needsRestock: data.needsRestock,
      commonHours: data.commonHours.trim(),
      responsibleName: data.responsibleName.trim(),
      responsibleContact: data.responsibleContact.trim(),
      organizationId: data.organizationId.trim(),
      notes: data.notes.trim(),
      approvalStatus: editingPoint?.approvalStatus ?? "pending",
      visibility: "public",
      updatedAt: serverTimestamp(),
    };

    setIsSaving(true);
    try {
      if (editingPoint) {
        await updateDoc(doc(db, "supportPoints", editingPoint.id), payload);
      } else {
        await addDoc(collection(db, "supportPoints"), {
          ...payload,
          approvalStatus: "pending",
          createdByUserId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      setEditingPoint(null);
      setError("");
    } catch {
      setError("Nao foi possivel salvar o ponto de apoio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db || profile?.role !== "admin") {
      return;
    }

    try {
      await deleteDoc(doc(db, "supportPoints", id));
      if (editingPoint?.id === id) {
        setEditingPoint(null);
      }
      toast.success("Ponto de apoio excluido.");
      setError("");
    } catch {
      toast.error("Nao foi possivel excluir o ponto de apoio.");
    }
  }

  if (isLoading || isProfileLoading || !user) {
    return (
      <AppLayout showNavigation>
        <main className="grid min-h-screen place-items-center px-4">
          <p className="text-sm font-medium text-muted">Carregando...</p>
        </main>
      </AppLayout>
    );
  }

  if (!can(profile?.role, "create_support_point")) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-danger-border bg-danger-bg p-5 text-sm leading-6 text-danger">
            Seu perfil atual nao tem permissao para cadastrar pontos de apoio.
          </section>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-240 px-4 py-6 sm:px-6">
        <UserSummary user={user} profile={profile} isProfileLoading={false} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pontos de apoio</h1>
          <p className="mt-2 max-w-180 text-sm leading-6 text-muted">
            Cadastros enviados aqui entram como pendentes. Um administrador
            revisa para evitar duplicidade antes de liberar no mapa publico.
          </p>
        </div>

        <div className="mb-5">
          <SupportPointSubmissionForm
            initialData={editingPointInitialData}
            duplicates={duplicateCandidates}
            isSaving={isSaving}
            onCancel={editingPoint ? () => setEditingPoint(null) : undefined}
            onChange={setDraftPoint}
            onSubmit={handleSave}
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-error bg-error-bg px-4 py-3 text-sm text-error-light">
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
          {isPointsLoading ? (
            <p className="px-4 py-5 text-sm text-muted">
              Carregando seus pontos...
            </p>
          ) : sortedPoints.length > 0 ? (
            <ul>
              {sortedPoints.map((point) => (
                <li
                  key={point.id}
                  className="grid gap-3 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={point.type} />
                      <AdminStatusBadge
                        label={point.approvalStatus}
                        tone={getApprovalTone(point.approvalStatus)}
                      />
                      {point.needsRestock ? (
                        <AdminStatusBadge label="Reposicao" tone="warning" />
                      ) : null}
                    </div>
                    <p className="truncate text-sm font-bold text-white">
                      {point.name || "Sem nome"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {point.responsibleName ||
                        point.commonHours ||
                        "Sem responsavel"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingPoint(point)}
                      variant="icon"
                      size="icon"
                      aria-label="Editar ponto"
                      icon={<Pencil className="size-4" strokeWidth={2.2} />}
                    />
                    {profile?.role === "admin" ? (
                      <Button
                        onClick={() => void handleDelete(point.id)}
                        variant="danger"
                        size="icon"
                        aria-label="Excluir ponto"
                        icon={<Trash2 className="size-4" strokeWidth={2.2} />}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <AdminEmptyState
                title="Nenhum envio encontrado"
                description="Use o formulario acima para enviar um ponto de apoio para revisao."
              />
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}

function supportPointRowFromSource(source: DuplicateSourceItem): SupportPointRow {
  const data = source.data;
  const location = data.location;

  return {
    id: source.id,
    name: String(data.name || ""),
    type: String(data.type || "donation_point"),
    latitude:
      location && typeof location.latitude === "number"
        ? String(location.latitude)
        : "",
    longitude:
      location && typeof location.longitude === "number"
        ? String(location.longitude)
        : "",
    foodAvailable: data.foodAvailable === true,
    waterAvailable: data.waterAvailable === true,
    needsRestock: data.needsRestock === true,
    commonHours: String(data.commonHours || ""),
    responsibleName: String(data.responsibleName || ""),
    responsibleContact: String(data.responsibleContact || ""),
    organizationId: String(data.organizationId || ""),
    notes: String(data.notes || ""),
    approvalStatus: String(data.approvalStatus || "pending"),
    visibility: String(data.visibility || "public"),
  };
}

function supportPointRowToFormData(
  row: SupportPointRow,
): SupportPointSubmissionFormData {
  return {
    name: row.name,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    foodAvailable: row.foodAvailable,
    waterAvailable: row.waterAvailable,
    needsRestock: row.needsRestock,
    commonHours: row.commonHours,
    responsibleName: row.responsibleName,
    responsibleContact: row.responsibleContact,
    organizationId: row.organizationId,
    notes: row.notes,
  };
}

function supportPointDraftToData(data: SupportPointSubmissionFormData) {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    name: data.name,
    type: data.type,
    location: hasLocation ? { latitude, longitude } : null,
    foodAvailable: data.foodAvailable,
    waterAvailable: data.waterAvailable,
    needsRestock: data.needsRestock,
    commonHours: data.commonHours,
    responsibleName: data.responsibleName,
    responsibleContact: data.responsibleContact,
    organizationId: data.organizationId,
    notes: data.notes,
    approvalStatus: "pending",
  };
}

function getApprovalTone(status: string) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected") {
    return "danger";
  }

  return "warning";
}
