"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { FileText, PawPrint, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { UserSummary } from "@/components/auth/user-summary";
import { Button, buttonClassName } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { Dialog } from "@/components/ui/dialog";
import { UpgradeDialog } from "@/components/commercial/upgrade-dialog";
import {
  DomesticPetForm,
  type DomesticPetSubmissionFormData,
} from "@/components/commercial/domestic-pet-form";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";
import type { DomesticPet, Organization, Tutor } from "@/types/domain";

export default function PetsPage() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  // Organizations and selection
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [isOrgsLoading, setIsOrgsLoading] = useState(true);

  // Data lists
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pets, setPets] = useState<DomesticPet[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTutor, setFilterTutor] = useState("all");

  // Form states
  const [editingPet, setEditingPet] = useState<DomesticPet | null>(null);
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

  // 2. Fetch tutors and domestic pets when active organization changes
  useEffect(() => {
    if (!db || !activeOrgId) {
      setTutors([]);
      setPets([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    const tutorsQuery = query(
      collection(db, "tutors"),
      where("organizationId", "==", activeOrgId)
    );

    const petsQuery = query(
      collection(db, "domesticPets"),
      where("organizationId", "==", activeOrgId)
    );

    const unsubscribeTutors = onSnapshot(
      tutorsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Tutor[];
        setTutors(list);
      },
      () => {
        toast.error("Erro ao carregar tutores.");
      }
    );

    const unsubscribePets = onSnapshot(
      petsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            organizationId: String(data.organizationId || ""),
            tutorId: String(data.tutorId || ""),
            name: String(data.name || ""),
            species: data.species || "dog",
            sex: data.sex || "unknown",
            size: data.size || "unknown",
            breed: String(data.breed || ""),
            birthDate: String(data.birthDate || ""),
            photoUrl: String(data.photoUrl || ""),
            notes: String(data.notes || ""),
          } as DomesticPet;
        });
        setPets(list);
        setIsDataLoading(false);
      },
      () => {
        setError("Não foi possível carregar os animais domésticos.");
        setIsDataLoading(false);
      }
    );

    return () => {
      unsubscribeTutors();
      unsubscribePets();
    };
  }, [activeOrgId]);

  // Map tutor names for quick lookup
  const tutorMap = useMemo(() => {
    return tutors.reduce<Record<string, string>>((acc, tutor) => {
      acc[tutor.id] = tutor.name;
      return acc;
    }, {});
  }, [tutors]);

  // Filter and sort pets
  const filteredPets = useMemo(() => {
    return pets
      .filter((pet) => {
        // Search query
        const queryNorm = searchQuery.toLowerCase().trim();
        if (queryNorm) {
          const nameMatch = pet.name.toLowerCase().includes(queryNorm);
          const breedMatch = pet.breed && pet.breed.toLowerCase().includes(queryNorm);
          if (!nameMatch && !breedMatch) return false;
        }

        // Species filter
        if (filterSpecies !== "all" && pet.species !== filterSpecies) {
          return false;
        }

        // Size filter
        if (filterSize !== "all" && pet.size !== filterSize) {
          return false;
        }

        // Tutor filter
        if (filterTutor !== "all" && pet.tutorId !== filterTutor) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [pets, searchQuery, filterSpecies, filterSize, filterTutor]);

  // Map editing pet entity to Submission Form Data
  const editingPetInitialData = useMemo(() => {
    if (!editingPet) return null;
    return {
      tutorId: editingPet.tutorId,
      name: editingPet.name,
      species: editingPet.species,
      sex: editingPet.sex,
      size: editingPet.size,
      breed: editingPet.breed || "",
      birthDate: editingPet.birthDate || "",
      photoUrl: editingPet.photoUrl || "",
      notes: editingPet.notes || "",
    } as DomesticPetSubmissionFormData;
  }, [editingPet]);

  async function handleSave(data: DomesticPetSubmissionFormData) {
    if (!db || !activeOrgId || !can(profile?.role, "manage_commercial_pets")) {
      return;
    }

    const payload = {
      organizationId: activeOrgId,
      tutorId: data.tutorId,
      name: data.name.trim(),
      species: data.species,
      sex: data.sex,
      size: data.size,
      breed: data.breed.trim(),
      birthDate: data.birthDate,
      photoUrl: data.photoUrl.trim(),
      notes: data.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    setIsSaving(true);
    try {
      if (editingPet) {
        await updateDoc(doc(db, "domesticPets", editingPet.id), payload);
        toast.success("Pet atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "domesticPets"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Pet cadastrado com sucesso!");
      }
      setEditingPet(null);
      setIsModalOpen(false);
      setError("");
    } catch {
      setError("Não foi possível salvar os dados do pet.");
      toast.error("Falha ao salvar pet.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db || !can(profile?.role, "manage_commercial_pets")) {
      return;
    }

    if (!confirm("Tem certeza que deseja remover este pet?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "domesticPets", id));
      toast.success("Pet removido com sucesso!");
      if (editingPet?.id === id) {
        setEditingPet(null);
      }
    } catch {
      toast.error("Erro ao remover pet.");
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
            Seu perfil atual não tem permissão para gerenciar pets.
          </section>
        </main>
      </AppLayout>
    );
  }

  const filterTutorsOptions = [
    { value: "all", label: "Todos os Tutores" },
    ...tutors.map((t) => ({ value: t.id, label: t.name })),
  ];

  const filterSpeciesOptions = [
    { value: "all", label: "Todas as Espécies" },
    { value: "dog", label: "Cachorros" },
    { value: "cat", label: "Gatos" },
    { value: "other", label: "Outros" },
  ];

  const filterSizeOptions = [
    { value: "all", label: "Todos os Portes" },
    { value: "small", label: "Pequeno" },
    { value: "medium", label: "Médio" },
    { value: "large", label: "Grande" },
    { value: "giant", label: "Gigante" },
    { value: "unknown", label: "Desconhecido" },
  ];

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-240 px-4 py-6 sm:px-6">
        <UserSummary user={user} profile={profile} isProfileLoading={false} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <PawPrint className="size-6 text-accent" /> Pets Domésticos
            </h1>
            <p className="mt-2 text-sm text-muted">
              Gerencie os animais cadastrados para atendimento no estabelecimento.
            </p>
          </div>

          {/* Org Selector */}
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
            Para gerenciar pets, você precisa primeiro estar associado a uma Organização aprovada.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filters grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-surface p-4 rounded-lg border border-bd-muted">
              <div className="sm:col-span-2 lg:col-span-4">
                <InputField
                  label="Buscar Pet"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busque por nome ou raça..."
                  icon={<Search className="size-4" />}
                />
              </div>
              
              <SelectField
                label="Espécie"
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                options={filterSpeciesOptions}
              />

              <SelectField
                label="Porte"
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                options={filterSizeOptions}
              />

              <div className="sm:col-span-2">
                <SelectField
                  label="Tutor"
                  value={filterTutor}
                  onChange={(e) => setFilterTutor(e.target.value)}
                  options={filterTutorsOptions}
                />
              </div>
            </div>

            {/* Grid cards */}
            {isDataLoading ? (
              <p className="rounded-lg border border-bd-muted bg-surface px-4 py-5 text-sm text-muted">
                Carregando pets...
              </p>
            ) : filteredPets.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredPets.map((pet) => (
                  <article
                    key={pet.id}
                    className="flex gap-4 rounded-lg border border-bd-muted bg-surface p-4 transition hover:border-accent"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-bd-muted bg-surface-3">
                      {pet.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-muted">
                          <PawPrint className="size-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="truncate text-base font-bold text-white leading-normal">
                          {pet.name}
                        </h3>
                        <p className="truncate text-xs text-muted mt-1 uppercase font-bold">
                          {pet.species === "dog" ? "Cachorro" : pet.species === "cat" ? "Gato" : "Outro"} • {pet.breed || "Sem raça definida"}
                        </p>
                        <p className="truncate text-xs text-placeholder mt-0.5">
                          Tutor: {tutorMap[pet.tutorId] || "Tutor desconhecido"}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-bd-muted/50 pt-3">
                        <Link
                          href={`/pets/${pet.id}`}
                          className={buttonClassName({
                            variant: "link",
                            size: "sm",
                          }) + " px-0 text-accent hover:text-accent-2"}
                        >
                          <FileText className="size-4" /> Histórico Clínico
                        </Link>

                        <div className="flex gap-1.5">
                          <Button
                            onClick={() => {
                              setEditingPet(pet);
                              setIsModalOpen(true);
                            }}
                            variant="icon"
                            size="icon"
                            aria-label="Editar pet"
                            icon={<Pencil className="size-4" strokeWidth={2.2} />}
                          />
                          <Button
                            onClick={() => void handleDelete(pet.id)}
                            variant="danger"
                            size="icon"
                            aria-label="Excluir pet"
                            icon={<Trash2 className="size-4" strokeWidth={2.2} />}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-bd-muted bg-surface px-4 py-10 text-center text-sm text-muted">
                Nenhum animal doméstico localizado.
              </div>
            )}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog
          isOpen={isModalOpen}
          title={editingPet ? "Editar Pet" : "Cadastrar Novo Pet"}
          description="Preencha os dados do pet para salvar no prontuário."
          onClose={() => {
            setIsModalOpen(false);
            setEditingPet(null);
            setError("");
          }}
        >
          <DomesticPetForm
            tutors={tutors}
            initialData={editingPetInitialData}
            isSaving={isSaving}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingPet(null);
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
                if (isFreePlan && pets.length >= 5) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setEditingPet(null);
                setIsModalOpen(true);
                setError("");
              }}
              variant="primary"
              size="lg"
              className="rounded-lg px-6 shadow-[0_0_50px_rgba(155,135,255,0.35)]"
              icon={<Plus className="size-4" strokeWidth={3} />}
            >
              Novo Pet
            </Button>
          </div>
        )}

        {activeOrg && (
          <UpgradeDialog
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            orgId={activeOrg.id}
            orgName={activeOrg.name}
            resourceName="pets"
            limit={5}
          />
        )}
      </main>
    </AppLayout>
  );
}
