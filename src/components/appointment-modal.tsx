"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Clock3, PawPrint, Phone, User, X } from "lucide-react";
import type { Appointment, AppointmentFormData } from "@/types/appointment";
import { Button } from "./ui/button";
import { InputField } from "./ui/input-field";
import { TextareaField } from "./ui/textarea-field";

type AppointmentModalProps = {
  isOpen: boolean;
  selectedDate: string;
  appointment?: Appointment | null;
  error: string;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (appointment: AppointmentFormData) => boolean | Promise<boolean>;
};

const emptyForm = (selectedDate: string): AppointmentFormData => ({
  tutorName: "",
  petName: "",
  phone: "",
  service: "",
  date: selectedDate,
  time: "12:00",
});

export function AppointmentModal({
  isOpen,
  selectedDate,
  appointment,
  error,
  isSaving = false,
  onClose,
  onSubmit,
}: AppointmentModalProps) {
  const [form, setForm] = useState<AppointmentFormData>(() =>
    emptyForm(selectedDate),
  );

  useEffect(() => {
    if (isOpen) {
      setForm(
        appointment
          ? {
              tutorName: appointment.tutorName,
              petName: appointment.petName,
              phone: appointment.phone,
              service: appointment.service,
              date: appointment.date,
              time: appointment.time,
            }
          : emptyForm(selectedDate),
      );
    }
  }, [appointment, isOpen, selectedDate]);

  if (!isOpen) {
    return null;
  }

  function updateField(field: keyof AppointmentFormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const saved = await onSubmit(form);
    if (saved) {
      setForm(emptyForm(form.date));
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-background/70 px-4 py-8 backdrop-blur-md"
      onMouseDown={onClose}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative w-full max-w-88 rounded-xl bg-surface-3 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:max-w-116 sm:p-8"
      >
        <Button
          onClick={onClose}
          aria-label="Fechar modal"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          icon={<X className="size-5" />}
        >
        </Button>

        <div className="mb-7 pr-8">
          <h2 className="text-xl font-bold text-white">
            {appointment ? "Editar atendimento" : "Agende um atendimento"}
          </h2>
          <p className="mt-2 text-sm leading-5 text-muted">
            Preencha os dados do cliente para realizar o agendamento.
          </p>
        </div>

        <div className="space-y-4">
          <InputField
            label="Nome do tutor"
            value={form.tutorName}
            onChange={(event) => updateField("tutorName", event.target.value)}
            placeholder="Helena Souza"
            icon={<User className="size-4" />}
            required
          />
          <InputField
            label="Nome do pet"
            value={form.petName}
            onChange={(event) => updateField("petName", event.target.value)}
            placeholder="Cheddar"
            icon={<PawPrint className="size-4" />}
            required
          />
          <InputField
            label="Telefone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(00) 0 0000-0000"
            icon={<Phone className="size-4" />}
            required
          />
          <TextareaField
            label="Descricao do servico"
            value={form.service}
            onChange={(event) => updateField("service", event.target.value)}
            placeholder="Banho e tosa"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Data"
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              icon={<CalendarDays className="size-4" />}
              required
            />
            <InputField
              label="Hora"
              type="time"
              value={form.time}
              onChange={(event) => updateField("time", event.target.value)}
              icon={<Clock3 className="size-4" />}
              required
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            variant="primary"
            size="lg"
          >
            {isSaving ? "SALVANDO..." : appointment ? "SALVAR" : "AGENDAR"}
          </Button>
        </div>
      </form>
    </div>
  );
}
