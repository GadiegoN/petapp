"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudSun, Moon, Sun } from "lucide-react";
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
  type DocumentData,
} from "firebase/firestore";
import { AppLayout } from "@/components/app-layout";
import { AppointmentModal } from "@/components/appointment-modal";
import { UserSummary } from "@/components/auth/user-summary";
import { DateSelector } from "@/components/date-selector";
import { NewAppointmentButton } from "@/components/new-appointment-button";
import { PeriodCard } from "@/components/period-card";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { can } from "@/lib/permissions/roles";
import type {
  Appointment,
  AppointmentFormData,
  Period,
} from "@/types/appointment";
import type { DomesticPet, Organization, Tutor } from "@/types/domain";
import { getPeriodByTime } from "@/utils/get-period-by-time";

const periods: Array<{
  id: Period;
  title: string;
  timeRange: string;
  icon: typeof Sun;
  iconClassName: string;
}> = [
  {
    id: "morning",
    title: "Manha",
    timeRange: "09h-12h",
    icon: Sun,
    iconClassName: "text-accent-strong",
  },
  {
    id: "afternoon",
    title: "Tarde",
    timeRange: "13h-18h",
    icon: CloudSun,
    iconClassName: "text-[#b46b16]",
  },
  {
    id: "night",
    title: "Noite",
    timeRange: "19h-21h",
    icon: Moon,
    iconClassName: "text-[#f4d100]",
  },
];

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function appointmentFromFirestore(id: string, data: DocumentData): Appointment {
  return {
    id,
    userId: String(data.userId ?? ""),
    organizationId: data.organizationId ? String(data.organizationId) : undefined,
    tutorId: data.tutorId ? String(data.tutorId) : undefined,
    domesticPetId: data.domesticPetId ? String(data.domesticPetId) : undefined,
    date: String(data.date ?? ""),
    time: String(data.time ?? ""),
    petName: String(data.petName ?? ""),
    tutorName: String(data.tutorName ?? ""),
    phone: String(data.phone ?? ""),
    service: String(data.service ?? ""),
    period: data.period as Period,
  };
}

export default function Home() {
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading, isConfigured } =
    useAuth();
  
  // Organizations and selection
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [isOrgsLoading, setIsOrgsLoading] = useState(true);

  // Tutors and pets for normalized form
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pets, setPets] = useState<DomesticPet[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

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
      return;
    }

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
        setError("Erro ao carregar tutores.");
      }
    );

    const unsubscribePets = onSnapshot(
      petsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as DomesticPet[];
        setPets(list);
      },
      () => {
        setError("Erro ao carregar pets domésticos.");
      }
    );

    return () => {
      unsubscribeTutors();
      unsubscribePets();
    };
  }, [activeOrgId]);

  // 3. Load appointments based on organization or fallback to user uid
  useEffect(() => {
    if (!user || !db) {
      setAppointments([]);
      setIsAppointmentsLoading(false);
      return;
    }

    setIsAppointmentsLoading(true);

    let appointmentsQuery;
    if (activeOrgId) {
      appointmentsQuery = query(
        collection(db, "appointments"),
        where("organizationId", "==", activeOrgId)
      );
    } else {
      // Fallback for legacy accounts without organization
      appointmentsQuery = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid)
      );
    }

    return onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        setAppointments(
          snapshot.docs.map((appointmentDoc) =>
            appointmentFromFirestore(appointmentDoc.id, appointmentDoc.data()),
          ),
        );
        setIsAppointmentsLoading(false);
      },
      () => {
        setError("Nao foi possivel carregar os agendamentos.");
        setIsAppointmentsLoading(false);
      },
    );
  }, [user, activeOrgId]);

  const appointmentsByPeriod = useMemo(() => {
    const dayAppointments = appointments
      .filter((appointment) => appointment.date === selectedDate)
      .sort((first, second) => first.time.localeCompare(second.time));

    return periods.reduce<Record<Period, Appointment[]>>(
      (accumulator, period) => {
        accumulator[period.id] = dayAppointments.filter(
          (appointment) => appointment.period === period.id,
        );
        return accumulator;
      },
      { morning: [], afternoon: [], night: [] },
    );
  }, [appointments, selectedDate]);

  async function handleSaveAppointment(formData: AppointmentFormData) {
    if (!user || !db || !isConfigured) {
      setError("Configure o Firebase e faca login antes de salvar.");
      return false;
    }

    const period = getPeriodByTime(formData.time);

    if (period === "outside-hours") {
      setError("Escolha um horario entre 09h e 12h, 13h e 18h ou 19h e 21h.");
      return false;
    }

    const payload = {
      userId: user.uid,
      organizationId: activeOrgId || null,
      tutorId: formData.tutorId || null,
      domesticPetId: formData.domesticPetId || null,
      date: formData.date,
      time: formData.time,
      petName: formData.petName.trim(),
      tutorName: formData.tutorName.trim(),
      phone: formData.phone.trim(),
      service: formData.service.trim(),
      period,
      updatedAt: serverTimestamp(),
    };

    setIsSaving(true);

    try {
      if (editingAppointment) {
        await updateDoc(
          doc(db, "appointments", editingAppointment.id),
          payload,
        );
      } else {
        await addDoc(collection(db, "appointments"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setSelectedDate(formData.date);
      setError("");
      setEditingAppointment(null);
      setIsModalOpen(false);
      return true;
    } catch {
      setError("Nao foi possivel salvar o agendamento.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveAppointment(id: string) {
    if (!db) {
      setError("Configure o Firebase antes de excluir.");
      return;
    }

    try {
      await deleteDoc(doc(db, "appointments", id));
    } catch {
      setError("Nao foi possivel excluir o agendamento.");
    }
  }

  function handleEditAppointment(appointment: Appointment) {
    setError("");
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  }

  if (isLoading || isProfileLoading || !user) {
    return (
      <AppLayout>
        <main className="grid min-h-screen place-items-center px-4">
          <p className="text-sm font-medium text-muted">Carregando...</p>
        </main>
      </AppLayout>
    );
  }

  if (!can(profile?.role, "manage_appointments")) {
    return (
      <AppLayout showNavigation>
        <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-140 place-items-center px-4">
          <section className="rounded-lg border border-danger-border bg-danger-bg p-5 text-sm leading-6 text-danger">
            Seu perfil atual nao tem permissao para acessar a agenda.
          </section>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavigation>
      <main className="mx-auto w-full max-w-180 px-4 pt-8 sm:px-6 sm:pt-5">
        <UserSummary
          user={user}
          profile={profile}
          isProfileLoading={isProfileLoading}
        />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-white">
              Sua agenda
            </h1>
            <p className="mt-2 max-w-140 text-sm leading-6 text-muted">
              Aqui voce pode ver todos os clientes e servicos agendados para
              hoje.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Org Selector for admin or multi-org partners */}
            {(profile?.role === "admin" || organizations.length > 1) && (
              <label className="block min-w-48 text-left">
                <span className="mb-1 block text-[0.65rem] font-bold uppercase text-muted">
                  Organização
                </span>
                <select
                  value={activeOrgId}
                  onChange={(e) => setActiveOrgId(e.target.value)}
                  className="h-9 w-full rounded-md border border-bd-muted bg-surface-3 px-2 text-xs text-white outline-none focus:border-accent"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <DateSelector value={selectedDate} onChange={setSelectedDate} />
          </div>
        </div>

        {!isOrgsLoading && organizations.length === 0 ? (
          <div className="rounded-lg border border-warning-border bg-warning-bg/40 p-5 text-sm text-warning">
            Para gerenciar a agenda, você precisa primeiro estar associado a uma Organização aprovada.
          </div>
        ) : isAppointmentsLoading ? (
          <p className="rounded-lg bg-surface-3 px-5 py-6 text-sm text-muted">
            Carregando agendamentos...
          </p>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period.id}
                title={period.title}
                timeRange={period.timeRange}
                icon={period.icon}
                iconClassName={period.iconClassName}
                appointments={appointmentsByPeriod[period.id]}
                onEdit={handleEditAppointment}
                onRemove={handleRemoveAppointment}
              />
            ))}
          </div>
        )}
      </main>

      {!isOrgsLoading && organizations.length > 0 && (
        <NewAppointmentButton
          onClick={() => {
            setError("");
            setEditingAppointment(null);
            setIsModalOpen(true);
          }}
        />
      )}

      <AppointmentModal
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        appointment={editingAppointment}
        tutors={tutors}
        pets={pets}
        error={error}
        isSaving={isSaving}
        onClose={() => {
          setError("");
          setEditingAppointment(null);
          setIsModalOpen(false);
        }}
        onSubmit={handleSaveAppointment}
      />
    </AppLayout>
  );
}
