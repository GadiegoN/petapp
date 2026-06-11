"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { UserSummary } from "@/components/auth/user-summary";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Dialog } from "@/components/ui/dialog";
import { UpgradeDialog } from "@/components/commercial/upgrade-dialog";
import {
  TutorForm,
  type TutorSubmissionFormData,
} from "@/components/commercial/tutor-form";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";
import type { Organization, Tutor } from "@/types/domain";

export default function ClientsPage() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  
  // Organizations and selection
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [isOrgsLoading, setIsOrgsLoading] = useState(true);

  // Tutors
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isTutorsLoading, setIsTutorsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const isFreePlan = !activeOrg?.plan || activeOrg.plan === "free";

  // 1. Fetch relevant organizations based on user role
  useEffect(() => {
    if (!db || !user || !profile) {
      return;
    }

    setIsOrgsLoading(true);
    let orgsQuery;

    if (profile.role === "admin") {
      orgsQuery = query(collection(db, "organizations"));
    } else if (
      profile.role === "partner" &&
      profile.organizationIds &&
      profile.organizationIds.length > 0
    ) {
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
        
        // Auto-select first organization if none selected
        if (list.length > 0) {
          setActiveOrgId((current) => current || list[0].id);
        }
        setIsOrgsLoading(false);
      },
      () => {
        setError("Não foi possível carregar as organizações.");
        setIsOrgsLoading(false);
      }
    );
  }, [user, profile]);

  // 2. Fetch tutors when active organization changes
  useEffect(() => {
    if (!db || !activeOrgId) {
      setTutors([]);
      setIsTutorsLoading(false);
      return;
    }

    setIsTutorsLoading(true);
    const tutorsQuery = query(
      collection(db, "tutors"),
      where("organizationId", "==", activeOrgId)
    );

    return onSnapshot(
      tutorsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            organizationId: String(data.organizationId || ""),
            name: String(data.name || ""),
            phone: String(data.phone || ""),
            email: String(data.email || ""),
            address: data.address || {},
            notes: String(data.notes || ""),
          } as Tutor;
        });
        setTutors(list);
        setIsTutorsLoading(false);
      },
      () => {
        setError("Não foi possível carregar os clientes.");
        setIsTutorsLoading(false);
      }
    );
  }, [activeOrgId]);

  // Filter tutors based on search query
  const filteredTutors = useMemo(() => {
    return tutors
      .filter((tutor) => {
        const queryNorm = searchQuery.toLowerCase().trim();
        if (!queryNorm) return true;
        return (
          tutor.name.toLowerCase().includes(queryNorm) ||
          (tutor.phone && tutor.phone.includes(queryNorm)) ||
          (tutor.email && tutor.email.toLowerCase().includes(queryNorm))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tutors, searchQuery]);

  // Convert Tutor entity to Submission Form Data
  const editingTutorInitialData = useMemo(() => {
    if (!editingTutor) return null;
    return {
      name: editingTutor.name,
      phone: editingTutor.phone || "",
      email: editingTutor.email || "",
      notes: editingTutor.notes || "",
      street: editingTutor.address?.street || "",
      number: editingTutor.address?.number || "",
      district: editingTutor.address?.district || "",
      city: editingTutor.address?.city || "",
      state: editingTutor.address?.state || "",
      postalCode: editingTutor.address?.postalCode || "",
      complement: editingTutor.address?.complement || "",
    } as TutorSubmissionFormData;
  }, [editingTutor]);

  async function handleSave(data: TutorSubmissionFormData) {
    if (!db || !activeOrgId || !can(profile?.role, "manage_commercial_pets")) {
      return;
    }

    const payload = {
      organizationId: activeOrgId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      notes: data.notes.trim(),
      address: {
        street: data.street.trim(),
        number: data.number.trim(),
        district: data.district.trim(),
        city: data.city.trim(),
        state: data.state.trim().toUpperCase(),
        postalCode: data.postalCode.trim(),
        complement: data.complement.trim(),
      },
      updatedAt: serverTimestamp(),
    };

    setIsSaving(true);
    try {
      if (editingTutor) {
        await updateDoc(doc(db, "tutors", editingTutor.id), payload);
        toast.success("Tutor atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "tutors"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Tutor cadastrado com sucesso!");
      }
      setEditingTutor(null);
      setIsModalOpen(false);
      setError("");
    } catch {
      setError("Não foi possível salvar os dados do tutor.");
      toast.error("Falha ao salvar tutor.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db || !can(profile?.role, "manage_commercial_pets")) {
      return;
    }

    if (!confirm("Tem certeza que deseja remover este tutor? Isso não removerá seus pets associados automaticamente.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tutors", id));
      toast.success("Tutor removido com sucesso!");
      if (editingTutor?.id === id) {
        setEditingTutor(null);
      }
    } catch {
      toast.error("Erro ao remover tutor.");
    }
  }

  // Perms check
  if (isLoading || isProfileLoading || !user) {
    return (
      <AppLayout showNavigation>
        <main className="grid min-h-screen place-items-center px-4">
          <p className="text-sm font-medium text-muted">Carregando...</p>
        </main>
      </AppLayout>
    );
  }

  if (!can(profile?.role, "manage_commercial_pets")) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-danger-border bg-danger-bg p-5 text-sm leading-6 text-danger">
            Seu perfil atual não tem permissão para gerenciar clientes.
          </section>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-240 px-4 py-6 sm:px-6">
        <UserSummary user={user} profile={profile} isProfileLoading={false} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="size-6 text-accent" /> Clientes (Tutores)
            </h1>
            <p className="mt-2 text-sm text-muted">
              Gerencie a lista de proprietários de pets vinculados ao estabelecimento.
            </p>
          </div>

          {/* Org Selector for Admin or Multi-org partners */}
          {(profile?.role === "admin" || organizations.length > 1) && (
            <label className="block min-w-60">
              <span className="mb-1 block text-xs font-bold uppercase text-muted">
                Organização
              </span>
              <select
                value={activeOrgId}
                onChange={(e) => setActiveOrgId(e.target.value)}
                className="h-10 w-full rounded-md border border-bd-muted bg-surface-3 px-3 text-sm text-white outline-none focus:border-accent"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Display warning if not belonging to any approved organization */}
        {!isOrgsLoading && organizations.length === 0 ? (
          <div className="rounded-lg border border-warning-border bg-warning-bg/40 p-5 text-sm text-warning">
            Para gerenciar clientes, você precisa primeiro estar associado a uma Organização aprovada.
          </div>
        ) : (
          <div className="space-y-4">
            <InputField
              label="Buscar Tutor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busque por nome, email ou telefone..."
              icon={<Search className="size-4" />}
            />

            <section className="overflow-hidden rounded-lg border border-bd-muted bg-surface">
              {isTutorsLoading ? (
                <p className="px-4 py-5 text-sm text-muted">Carregando tutores...</p>
              ) : filteredTutors.length > 0 ? (
                <ul>
                  {filteredTutors.map((tutor) => (
                    <li
                      key={tutor.id}
                      className="flex flex-col justify-between gap-3 border-b border-bd-muted/70 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">
                          {tutor.name}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {tutor.email && <span>{tutor.email}</span>}
                          {tutor.email && tutor.phone && <span className="mx-1.5">•</span>}
                          {tutor.phone && <span>{tutor.phone}</span>}
                        </p>
                        {tutor.address?.city && (
                          <p className="text-[0.75rem] text-placeholder mt-0.5">
                            Endereço: {tutor.address.street}, {tutor.address.number} - {tutor.address.city}/{tutor.address.state}
                          </p>
                        )}
                        {tutor.notes && (
                          <p className="text-xs text-muted mt-1 italic line-clamp-1">
                            Nota: {tutor.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        <Button
                          onClick={() => {
                            setEditingTutor(tutor);
                            setIsModalOpen(true);
                          }}
                          variant="icon"
                          size="icon"
                          aria-label="Editar tutor"
                          icon={<Pencil className="size-4" strokeWidth={2.2} />}
                        />
                        <Button
                          onClick={() => void handleDelete(tutor.id)}
                          variant="danger"
                          size="icon"
                          aria-label="Excluir tutor"
                          icon={<Trash2 className="size-4" strokeWidth={2.2} />}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  Nenhum tutor localizado.
                </div>
              )}
            </section>
          </div>
        )}

        {/* Form Dialog */}
        <Dialog
          isOpen={isModalOpen}
          title={editingTutor ? "Editar Tutor" : "Cadastrar Novo Tutor"}
          description="Preencha os dados do tutor para salvar na plataforma."
          onClose={() => {
            setIsModalOpen(false);
            setEditingTutor(null);
            setError("");
          }}
        >
          <TutorForm
            initialData={editingTutorInitialData}
            isSaving={isSaving}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingTutor(null);
              setError("");
            }}
            onSubmit={handleSave}
          />
          {error && (
            <p className="mt-3 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-xs text-danger">
              {error}
            </p>
          )}
        </Dialog>

        {/* Floating Action Button (FAB) */}
        {!isOrgsLoading && organizations.length > 0 && (
          <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4 sm:inset-x-auto sm:right-7 sm:justify-end">
            <Button
              onClick={() => {
                if (isFreePlan && tutors.length >= 5) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setEditingTutor(null);
                setIsModalOpen(true);
                setError("");
              }}
              variant="primary"
              size="lg"
              className="rounded-lg px-6 shadow-[0_0_50px_rgba(155,135,255,0.35)]"
              icon={<Plus className="size-4" strokeWidth={3} />}
            >
              Novo Cliente
            </Button>
          </div>
        )}

        {activeOrg && (
          <UpgradeDialog
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            orgId={activeOrg.id}
            orgName={activeOrg.name}
            resourceName="clientes"
            limit={5}
          />
        )}
      </main>
    </AppLayout>
  );
}
