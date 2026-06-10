"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ArrowLeft, Calendar, FileText, PawPrint, PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { UserSummary } from "@/components/auth/user-summary";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";
import type { DomesticPet, PetHealthRecord, Tutor } from "@/types/domain";

type FormRecordData = {
  type: "vaccine" | "bath" | "grooming" | "medicine" | "exam" | "note";
  description: string;
  date: string;
};

const emptyRecordForm: FormRecordData = {
  type: "note",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

const recordTypeLabels: Record<string, string> = {
  vaccine: "Vacina",
  bath: "Banho",
  grooming: "Tosa",
  medicine: "Medicamento",
  exam: "Exame",
  note: "Observação",
};

const recordTypeTones: Record<string, string> = {
  vaccine: "border-accent bg-accent/10 text-accent",
  bath: "border-[#10b981] bg-[#10b981]/10 text-[#10b981]",
  grooming: "border-[#8b5cf6] bg-[#8b5cf6]/10 text-[#8b5cf6]",
  medicine: "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]",
  exam: "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]",
  note: "border-bd-muted bg-surface-3 text-muted",
};

export default function PetProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  const [pet, setPet] = useState<DomesticPet | null>(null);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [records, setRecords] = useState<PetHealthRecord[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [recordForm, setRecordForm] = useState<FormRecordData>(emptyRecordForm);
  const [error, setError] = useState("");

  // 1. Fetch Pet and Tutor details
  useEffect(() => {
    async function loadPetDetails() {
      if (!db || !params.id) {
        setIsDataLoading(false);
        return;
      }

      try {
        const petSnap = await getDoc(doc(db, "domesticPets", params.id));
        if (!petSnap.exists()) {
          setError("Pet não encontrado.");
          setIsDataLoading(false);
          return;
        }

        const petData = { id: petSnap.id, ...petSnap.data() } as DomesticPet;
        setPet(petData);

        // Fetch tutor
        if (petData.tutorId) {
          const tutorSnap = await getDoc(doc(db, "tutors", petData.tutorId));
          if (tutorSnap.exists()) {
            setTutor({ id: tutorSnap.id, ...tutorSnap.data() } as Tutor);
          }
        }
      } catch {
        setError("Erro ao carregar os detalhes do pet.");
      } finally {
        setIsDataLoading(false);
      }
    }

    void loadPetDetails();
  }, [params.id]);

  // 2. Real-time subscribe to clinical records of the pet
  useEffect(() => {
    if (!db || !params.id || !pet?.organizationId) {
      return;
    }

    const recordsQuery = query(
      collection(db, "petHealthRecords"),
      where("domesticPetId", "==", params.id),
      where("organizationId", "==", pet.organizationId)
    );

    return onSnapshot(
      recordsQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              organizationId: String(data.organizationId || ""),
              domesticPetId: String(data.domesticPetId || ""),
              type: data.type || "note",
              description: String(data.description || ""),
              date: String(data.date || ""),
              serviceIds: data.serviceIds || [],
              productIds: data.productIds || [],
              createdByUserId: String(data.createdByUserId || ""),
            } as PetHealthRecord;
          })
          .sort((a, b) => b.date.localeCompare(a.date)); // descending order of date
        setRecords(list);
      },
      () => {
        toast.error("Erro ao carregar histórico clínico.");
      }
    );
  }, [params.id, pet?.organizationId]);

  // Handle adding new clinical record
  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !user || !pet) {
      return;
    }

    if (!recordForm.description.trim()) {
      toast.error("Por favor, preencha a descrição do evento.");
      return;
    }

    setIsSavingRecord(true);
    try {
      const payload = {
        organizationId: pet.organizationId,
        domesticPetId: pet.id,
        type: recordForm.type,
        description: recordForm.description.trim(),
        date: recordForm.date,
        serviceIds: [],
        productIds: [],
        createdByUserId: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "petHealthRecords"), payload);
      toast.success("Evento clínico registrado!");
      setRecordForm({
        ...emptyRecordForm,
        date: new Date().toISOString().split("T")[0],
      });
    } catch {
      toast.error("Erro ao registrar no prontuário.");
    } finally {
      setIsSavingRecord(false);
    }
  }

  // Format date helper (YYYY-MM-DD -> DD/MM/YYYY)
  function formatDate(rawDate?: string) {
    if (!rawDate) return "N/A";
    const parts = rawDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return rawDate;
  }

  if (isLoading || isProfileLoading || isDataLoading || !user) {
    return (
      <AppLayout showNavigation>
        <main className="grid min-h-screen place-items-center px-4">
          <p className="text-sm font-medium text-muted">Carregando...</p>
        </main>
      </AppLayout>
    );
  }

  if (!can(profile?.role, "manage_commercial_pets") || error) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-danger-border bg-danger-bg p-5 text-sm leading-6 text-danger">
            {error || "Seu perfil atual não tem permissão para gerenciar prontuários médicos."}
          </section>
        </main>
      </AppLayout>
    );
  }

  const recordTypeOptions = [
    { value: "note", label: "Observação / Nota" },
    { value: "vaccine", label: "Vacina" },
    { value: "bath", label: "Banho" },
    { value: "grooming", label: "Tosa" },
    { value: "medicine", label: "Medicamento" },
    { value: "exam", label: "Exame" },
  ];

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-240 px-4 py-6 sm:px-6">
        <UserSummary user={user} profile={profile} isProfileLoading={false} />

        <div className="mb-6">
          <button
            onClick={() => router.push("/pets")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent transition hover:text-accent-2"
          >
            <ArrowLeft className="size-4 animate-pulse" /> Voltar para lista de Pets
          </button>
        </div>

        {pet && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Left side: Pet details and Timeline */}
            <div className="space-y-6">
              {/* Pet Info Card */}
              <section className="flex flex-col gap-4 rounded-lg border border-bd-muted bg-surface p-5 sm:flex-row sm:items-start">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-md border border-bd-muted bg-surface-3 mx-auto sm:mx-0">
                  {pet.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pet.photoUrl}
                      alt={pet.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted">
                      <PawPrint className="size-10" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h1 className="text-2xl font-black text-white">{pet.name}</h1>
                  <p className="mt-1 text-sm text-accent font-bold uppercase">
                    {pet.species === "dog" ? "Cachorro" : pet.species === "cat" ? "Gato" : "Outro"} • {pet.breed || "Sem raça definida"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted border-t border-bd-muted/50 pt-3">
                    <p>Sexo: <span className="text-white font-bold">{pet.sex === "male" ? "Macho" : pet.sex === "female" ? "Fêmea" : "Desconhecido"}</span></p>
                    <p>Porte: <span className="text-white font-bold">{pet.size === "small" ? "Pequeno" : pet.size === "medium" ? "Médio" : pet.size === "large" ? "Grande" : pet.size === "giant" ? "Gigante" : "Desconhecido"}</span></p>
                    <p className="col-span-2">Nascimento: <span className="text-white font-bold">{formatDate(pet.birthDate)}</span></p>
                  </div>
                  {pet.notes && (
                    <p className="mt-2 text-xs italic text-placeholder border-t border-bd-muted/50 pt-2">
                      Notas do Pet: {pet.notes}
                    </p>
                  )}
                </div>
              </section>

              {/* Timeline section */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                  <FileText className="size-5 text-accent" /> Histórico Clínico e Prontuário
                </h2>

                {records.length > 0 ? (
                  <div className="relative border-l border-bd-muted/70 pl-5 ml-2.5 space-y-6">
                    {records.map((record) => (
                      <div key={record.id} className="relative">
                        {/* Timeline node icon dot */}
                        <span className="absolute -left-8 top-1.5 flex size-4 items-center justify-center rounded-full bg-surface border-2 border-accent" />

                        <div className="rounded-lg border border-bd-muted/80 bg-surface-3 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bd-muted/40 pb-2 mb-2">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[0.7rem] font-bold uppercase ${
                                recordTypeTones[record.type] || recordTypeTones.note
                              }`}
                            >
                              {recordTypeLabels[record.type] || "Observação"}
                            </span>
                            <span className="text-xs font-bold text-muted flex items-center gap-1">
                              <Calendar className="size-3.5" /> {formatDate(record.date)}
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-white whitespace-pre-wrap">
                            {record.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted">
                    Nenhum registro clínico adicionado a este prontuário.
                  </div>
                )}
              </section>
            </div>

            {/* Right side: Tutor Details & Add Event Form */}
            <div className="space-y-6">
              {/* Tutor details card */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-bd-muted/50 pb-3 mb-3">
                  <User className="size-5 text-accent" /> Tutor Responsável
                </h2>

                {tutor ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-white">{tutor.name}</p>
                    {tutor.phone && <p className="text-muted">Telefone: <span className="text-fg">{tutor.phone}</span></p>}
                    {tutor.email && <p className="text-muted">E-mail: <span className="text-fg">{tutor.email}</span></p>}
                    {tutor.address?.city && (
                      <div className="border-t border-bd-muted/50 pt-2 mt-2 text-xs text-placeholder">
                        <p className="font-bold text-muted">Endereço:</p>
                        <p>{tutor.address.street}, {tutor.address.number}</p>
                        <p>{tutor.address.district} - {tutor.address.city}/{tutor.address.state}</p>
                        {tutor.address.complement && <p>Compl: {tutor.address.complement}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">Tutor não cadastrado ou indisponível.</p>
                )}
              </section>

              {/* Add event Form */}
              <section className="rounded-lg border border-bd-muted bg-surface p-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <PlusCircle className="size-5 text-accent" /> Adicionar Evento Clínico
                </h2>

                <form onSubmit={handleAddRecord} className="space-y-4">
                  <SelectField
                    label="Tipo de Evento *"
                    value={recordForm.type}
                    onChange={(e) =>
                      setRecordForm((curr) => ({
                        ...curr,
                        type: e.target.value as FormRecordData["type"],
                      }))
                    }
                    options={recordTypeOptions}
                    required
                  />

                  <InputField
                    label="Data do Evento *"
                    type="date"
                    value={recordForm.date}
                    onChange={(e) =>
                      setRecordForm((curr) => ({ ...curr, date: e.target.value }))
                    }
                    required
                  />

                  <TextareaField
                    label="Descrição do Evento *"
                    value={recordForm.description}
                    onChange={(e) =>
                      setRecordForm((curr) => ({
                        ...curr,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descreva a aplicação da vacina, sintomas relatados, detalhes do banho, etc..."
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={isSavingRecord || !recordForm.description.trim()}
                  >
                    {isSavingRecord ? "Registrando..." : "Adicionar ao Prontuário"}
                  </Button>
                </form>
              </section>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
