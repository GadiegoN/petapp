"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudSun, LogOut, Moon, Sun } from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { AppLayout } from "@/components/app-layout";
import { AppointmentModal } from "@/components/appointment-modal";
import { DateSelector } from "@/components/date-selector";
import { Header } from "@/components/header";
import { NewAppointmentButton } from "@/components/new-appointment-button";
import { PeriodCard } from "@/components/period-card";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import type {
  Appointment,
  AppointmentFormData,
  Period,
} from "@/types/appointment";
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
    iconClassName: "text-[#1488ff]",
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

function appointmentFromFirestore(
  id: string,
  data: DocumentData,
): Appointment {
  return {
    id,
    userId: String(data.userId ?? ""),
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
  const { user, isLoading, isConfigured, signOut } = useAuth();
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

  useEffect(() => {
    if (!user || !db) {
      setAppointments([]);
      setIsAppointmentsLoading(false);
      return;
    }

    setIsAppointmentsLoading(true);

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
    );

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
  }, [user]);

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
        await updateDoc(doc(db, "appointments", editingAppointment.id), payload);
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

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (isLoading || !user) {
    return (
      <AppLayout>
        <main className="grid min-h-screen place-items-center px-4">
          <p className="text-sm font-medium text-[#a1a1aa]">Carregando...</p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between">
        <Header />
        <button
          type="button"
          onClick={handleSignOut}
          className="mr-3 mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-[#30313d] bg-[#25252e] px-3 text-xs font-bold uppercase text-[#f5f5f7] transition hover:border-[#9b87ff] hover:text-[#9b87ff]"
        >
          <LogOut className="size-4" strokeWidth={2.2} />
          Sair
        </button>
      </div>

      <main className="mx-auto w-full max-w-180 px-4 pt-8 sm:px-6 sm:pt-5">
        <div className="mb-8 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-white">
              Sua agenda
            </h1>
            <p className="mt-2 max-w-140 text-sm leading-6 text-[#a1a1aa]">
              Aqui voce pode ver todos os clientes e servicos agendados para
              hoje.
            </p>
          </div>
          <DateSelector value={selectedDate} onChange={setSelectedDate} />
        </div>

        {isAppointmentsLoading ? (
          <p className="rounded-lg bg-[#1f2028] px-5 py-6 text-sm text-[#a1a1aa]">
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

      <NewAppointmentButton
        onClick={() => {
          setError("");
          setEditingAppointment(null);
          setIsModalOpen(true);
        }}
      />

      <AppointmentModal
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        appointment={editingAppointment}
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
