"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Clock3, PawPrint, Phone, User } from "lucide-react";
import type { Appointment, AppointmentFormData } from "@/types/appointment";
import { Button } from "./ui/button";
import { InputField } from "./ui/input-field";
import { SelectField } from "./ui/select-field";
import { TextareaField } from "./ui/textarea-field";
import type { Tutor, DomesticPet } from "@/types/domain";
import { Dialog } from "./ui/dialog";

type AppointmentModalProps = {
  isOpen: boolean;
  selectedDate: string;
  appointment?: Appointment | null;
  error: string;
  isSaving?: boolean;
  tutors: Tutor[];
  pets: DomesticPet[];
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
  tutorId: "",
  domesticPetId: "",
});

export function AppointmentModal({
  isOpen,
  selectedDate,
  appointment,
  error,
  isSaving = false,
  tutors,
  pets,
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
              tutorId: appointment.tutorId || "",
              domesticPetId: appointment.domesticPetId || "",
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

  function handleTutorChange(tutorId: string) {
    if (!tutorId) {
      setForm(curr => ({
        ...curr,
        tutorId: "",
        domesticPetId: "",
      }));
      return;
    }

    const selectedTutor = tutors.find(t => t.id === tutorId);
    if (selectedTutor) {
      setForm(curr => ({
        ...curr,
        tutorId,
        tutorName: selectedTutor.name,
        phone: selectedTutor.phone || "",
        domesticPetId: "", // Clear pet when tutor changes
      }));
    }
  }

  function handlePetChange(petId: string) {
    if (!petId) {
      setForm(curr => ({
        ...curr,
        domesticPetId: "",
      }));
      return;
    }

    const selectedPet = pets.find(p => p.id === petId);
    if (selectedPet) {
      setForm(curr => ({
        ...curr,
        domesticPetId: petId,
        petName: selectedPet.name,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const saved = await onSubmit(form);
    if (saved) {
      setForm(emptyForm(form.date));
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      title={appointment ? "Editar atendimento" : "Agende um atendimento"}
      description="Preencha os dados do cliente para realizar o agendamento."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {tutors.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Tutor Cadastrado (Opcional)"
                value={form.tutorId || ""}
                onChange={(e) => handleTutorChange(e.target.value)}
                options={[
                  { value: "", label: "Digitar manualmente..." },
                  ...tutors.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
              <SelectField
                label="Pet Cadastrado (Opcional)"
                value={form.domesticPetId || ""}
                onChange={(e) => handlePetChange(e.target.value)}
                disabled={!form.tutorId}
                options={[
                  { value: "", label: form.tutorId ? "Digitar manualmente..." : "Selecione um tutor primeiro..." },
                  ...pets
                    .filter((p) => p.tutorId === form.tutorId)
                    .map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
          )}

          <InputField
            label="Nome do tutor"
            value={form.tutorName}
            onChange={(event) => {
              updateField("tutorName", event.target.value);
              if (form.tutorId) updateField("tutorId", "");
            }}
            placeholder="Helena Souza"
            icon={<User className="size-4" />}
            required
          />
          <InputField
            label="Nome do pet"
            value={form.petName}
            onChange={(event) => {
              updateField("petName", event.target.value);
              if (form.domesticPetId) updateField("domesticPetId", "");
            }}
            placeholder="Cheddar"
            icon={<PawPrint className="size-4" />}
            required
          />
          <InputField
            label="Telefone"
            value={form.phone}
            onChange={(event) => {
              updateField("phone", event.target.value);
              if (form.tutorId) updateField("tutorId", "");
            }}
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
    </Dialog>
  );
}
