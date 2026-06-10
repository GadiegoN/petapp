"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { recordStreetDogHistory } from "@/lib/community-history";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  StreetDogSubmissionForm,
  type StreetDogSubmissionFormData,
} from "@/components/community/street-dog-submission-form";
import { AppLayout } from "@/components/app-layout";
import { UserSummary } from "@/components/auth/user-summary";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  findStreetDogDuplicates,
  type DuplicateSourceItem,
} from "@/lib/duplicates/community-duplicates";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";

type StreetDogRow = StreetDogSubmissionFormData & {
  id: string;
  approvalStatus: string;
  visibility: string;
  rejectionReason?: string;
  duplicateOfId?: string;
};

export default function StreetDogsPage() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const [dogs, setDogs] = useState<DuplicateSourceItem[]>([]);
  const [draftDog, setDraftDog] = useState<StreetDogSubmissionFormData | null>(
    null,
  );
  const [editingDog, setEditingDog] = useState<StreetDogRow | null>(null);
  const [isDogsLoading, setIsDogsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !user) {
      setDogs([]);
      setIsDogsLoading(false);
      return;
    }

    return onSnapshot(
      query(collection(db, "streetDogs")),
      (snapshot) => {
        setDogs(
          snapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
        );
        setError("");
        setIsDogsLoading(false);
      },
      () => {
        setError("Nao foi possivel carregar seus cadastros.");
        setIsDogsLoading(false);
      },
    );
  }, [user]);

  const sortedDogs = useMemo(
    () =>
      dogs
        .filter(
          (dog) =>
            profile?.role === "admin" || dog.data.createdByUserId === user?.uid,
        )
        .map((dog) => streetDogRowFromSource(dog))
        .sort((first, second) => first.nickname.localeCompare(second.nickname)),
    [dogs, profile?.role, user?.uid],
  );

  const duplicateCandidates = useMemo(() => {
    if (!draftDog) {
      return [];
    }

    return findStreetDogDuplicates(
      editingDog?.id ?? "",
      streetDogDraftToData(draftDog),
      dogs,
    );
  }, [dogs, draftDog, editingDog?.id]);

  const editingDogInitialData = useMemo(
    () => (editingDog ? streetDogRowToFormData(editingDog) : null),
    [editingDog],
  );

  async function handleSave(data: StreetDogSubmissionFormData) {
    if (!db || !user || !can(profile?.role, "create_street_dog")) {
      return;
    }

    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

    const isApprovedEdit = editingDog?.approvalStatus === "approved";
    const isReviewReset = isApprovedEdit && profile?.role !== "admin";

    const payload = {
      nickname: data.nickname.trim(),
      photoUrl: data.photoUrl.trim(),
      sex: data.sex,
      size: data.size,
      color: data.color.trim(),
      approximateBreed: data.approximateBreed.trim(),
      temperament: data.temperament.trim(),
      notes: data.notes.trim(),
      status: data.status,
      vaccination: data.vaccination,
      neutering: data.neutering,
      regionLabel: data.regionLabel.trim(),
      mainLocation: hasLocation ? { latitude, longitude } : null,
      approvalStatus: editingDog
        ? isReviewReset
          ? "pending"
          : editingDog.approvalStatus
        : "pending",
      visibility: "public",
      updatedAt: serverTimestamp(),
      ...(isReviewReset
        ? {
            reviewedByUserId: "",
            reviewedAt: null,
          }
        : {}),
    };

    setIsSaving(true);
    try {
      if (editingDog) {
        await updateDoc(doc(db, "streetDogs", editingDog.id), payload);
        await recordStreetDogHistory(db, {
          streetDogId: editingDog.id,
          type: "edited",
          description: isReviewReset
            ? "Cadastro editado e enviado para revisao novamente."
            : "Cadastro editado.",
          createdByUserId: user.uid,
          isPublic: false,
        });
      } else {
        const newDogRef = await addDoc(collection(db, "streetDogs"), {
          ...payload,
          approvalStatus: "pending",
          createdByUserId: user.uid,
          approvedByUserId: "",
          createdAt: serverTimestamp(),
        });

        await recordStreetDogHistory(db, {
          streetDogId: newDogRef.id,
          type: "created",
          description: "Cadastro criado.",
          createdByUserId: user.uid,
          isPublic: false,
        });
      }
      setEditingDog(null);
      setError("");
    } catch {
      setError("Nao foi possivel salvar o cadastro.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db || profile?.role !== "admin") {
      return;
    }

    try {
      await deleteDoc(doc(db, "streetDogs", id));
      if (editingDog?.id === id) {
        setEditingDog(null);
      }
      toast.success("Cao excluido.");
      setError("");
    } catch {
      toast.error("Nao foi possivel excluir o cao.");
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

  if (!can(profile?.role, "create_street_dog")) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-danger-border bg-danger-bg p-5 text-sm leading-6 text-danger">
            Seu perfil atual nao tem permissao para cadastrar caes de rua.
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
          <h1 className="text-2xl font-bold text-white">Caes de rua</h1>
          <p className="mt-2 max-w-180 text-sm leading-6 text-muted">
            Cadastros enviados aqui entram como pendentes. Confira os avisos de
            possiveis duplicados antes de enviar.
          </p>
        </div>

        <div className="mb-5">
          <StreetDogSubmissionForm
            initialData={editingDogInitialData}
            duplicates={duplicateCandidates}
            isSaving={isSaving}
            onCancel={editingDog ? () => setEditingDog(null) : undefined}
            onChange={setDraftDog}
            onSubmit={handleSave}
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-error bg-error-bg px-4 py-3 text-sm text-error-light">
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
          {isDogsLoading ? (
            <p className="px-4 py-5 text-sm text-muted">
              Carregando seus cadastros...
            </p>
          ) : sortedDogs.length > 0 ? (
            <ul>
              {sortedDogs.map((dog) => (
                <li
                  key={dog.id}
                  className="grid gap-3 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={dog.status} />
                      <AdminStatusBadge
                        label={getApprovalLabel(
                          dog.approvalStatus,
                          dog.rejectionReason,
                        )}
                        tone={getApprovalTone(
                          dog.approvalStatus,
                          dog.rejectionReason,
                        )}
                      />
                    </div>
                    <p className="truncate text-sm font-bold text-white">
                      {dog.nickname || "Sem apelido"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {dog.regionLabel || dog.color || "Sem regiao informada"}
                    </p>
                    {dog.approvalStatus === "approved" && (
                      <Link
                        href={`/caes/${dog.id}`}
                        className="mt-1 inline-flex text-xs font-bold text-accent hover:text-accent-2 hover:underline transition"
                      >
                        Visualizar Página Pública →
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingDog(dog)}
                      variant="icon"
                      size="icon"
                      aria-label="Editar cao"
                      icon={<Pencil className="size-4" strokeWidth={2.2} />}
                    />
                    {profile?.role === "admin" ? (
                      <Button
                        onClick={() => void handleDelete(dog.id)}
                        variant="danger"
                        size="icon"
                        aria-label="Excluir cao"
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
                description="Use o formulario acima para enviar um cao de rua para revisao."
              />
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}

function streetDogRowFromSource(source: DuplicateSourceItem): StreetDogRow {
  const data = source.data;
  const location = data.mainLocation;

  return {
    id: source.id,
    nickname: String(data.nickname || ""),
    photoUrl: String(data.photoUrl || ""),
    sex: String(data.sex || "unknown"),
    size: String(data.size || "unknown"),
    color: String(data.color || ""),
    approximateBreed: String(data.approximateBreed || ""),
    temperament: String(data.temperament || ""),
    notes: String(data.notes || ""),
    status: String(data.status || "street"),
    vaccination: String(data.vaccination || "unknown"),
    neutering: String(data.neutering || "unknown"),
    regionLabel: String(data.regionLabel || ""),
    latitude:
      location && typeof location.latitude === "number"
        ? String(location.latitude)
        : "",
    longitude:
      location && typeof location.longitude === "number"
        ? String(location.longitude)
        : "",
    approvalStatus: String(data.approvalStatus || "pending"),
    rejectionReason: String(data.rejectionReason || ""),
    duplicateOfId: String(data.duplicateOfId || ""),
    visibility: String(data.visibility || "public"),
  };
}

function getApprovalLabel(status: string, rejectionReason?: string) {
  if (status === "pending") {
    return "Pendente";
  }

  if (status === "approved") {
    return "Aprovado";
  }

  if (status === "rejected") {
    return rejectionReason === "duplicate" ? "Duplicado" : "Rejeitado";
  }

  return "Desconhecido";
}

function getApprovalTone(status: string, rejectionReason?: string) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected") {
    return rejectionReason === "duplicate" ? "danger" : "danger";
  }

  return "warning";
}

function streetDogRowToFormData(
  row: StreetDogRow,
): StreetDogSubmissionFormData {
  return {
    nickname: row.nickname,
    photoUrl: row.photoUrl,
    sex: row.sex,
    size: row.size,
    color: row.color,
    approximateBreed: row.approximateBreed,
    temperament: row.temperament,
    notes: row.notes,
    status: row.status,
    vaccination: row.vaccination,
    neutering: row.neutering,
    regionLabel: row.regionLabel,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

function streetDogDraftToData(data: StreetDogSubmissionFormData) {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    nickname: data.nickname,
    photoUrl: data.photoUrl,
    sex: data.sex,
    size: data.size,
    color: data.color,
    approximateBreed: data.approximateBreed,
    temperament: data.temperament,
    notes: data.notes,
    status: data.status,
    vaccination: data.vaccination,
    neutering: data.neutering,
    regionLabel: data.regionLabel,
    mainLocation: hasLocation ? { latitude, longitude } : null,
    approvalStatus: "pending",
  };
}
