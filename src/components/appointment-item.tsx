import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { Button } from "@/components/ui/button";

type AppointmentItemProps = {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onRemove: (id: string) => void;
};

export function AppointmentItem({
  appointment,
  onEdit,
  onRemove,
}: AppointmentItemProps) {
  return (
    <li className="grid gap-3 border-t border-bd-muted/60 px-5 py-5 text-sm sm:grid-cols-[4rem_1fr_1fr_auto] sm:items-center sm:px-7">
      <time className="text-sm font-bold text-white">{appointment.time}</time>

      <div className="min-w-0">
        {appointment.domesticPetId ? (
          <Link
            href={`/pets/${appointment.domesticPetId}`}
            className="font-bold text-accent hover:text-accent-2 hover:underline transition"
          >
            {appointment.petName}
          </Link>
        ) : (
          <span className="font-bold text-white">{appointment.petName}</span>
        )}
        <span className="ml-1 text-xs text-muted">
          / {appointment.tutorName}
        </span>
      </div>

      <p className="min-w-0 text-xs leading-5 text-muted sm:text-sm">
        {appointment.service}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => onEdit(appointment)}
          variant="link"
          size="sm"
          className="h-auto w-fit px-0 text-placeholder"
          aria-label={`Editar agendamento de ${appointment.petName}`}
          icon={<Pencil className="size-3.5 sm:hidden" />}
        >
          Editar
        </Button>

        <Button
          onClick={() => onRemove(appointment.id)}
          variant="link"
          size="sm"
          className="h-auto w-fit px-0 text-placeholder hover:text-red-400"
          aria-label={`Remover agendamento de ${appointment.petName}`}
          icon={<Trash2 className="size-3.5 sm:hidden" />}
        >
          Remover
        </Button>
      </div>
    </li>
  );
}
