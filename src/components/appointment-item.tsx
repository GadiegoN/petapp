import { Pencil, Trash2 } from "lucide-react";
import type { Appointment } from "@/types/appointment";

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
    <li className="grid gap-3 border-t border-[#30313d]/60 px-5 py-5 text-sm sm:grid-cols-[4rem_1fr_1fr_auto] sm:items-center sm:px-7">
      <time className="text-sm font-bold text-white">{appointment.time}</time>

      <div className="min-w-0">
        <span className="font-bold text-white">{appointment.petName}</span>
        <span className="ml-1 text-xs text-[#a1a1aa]">
          / {appointment.tutorName}
        </span>
      </div>

      <p className="min-w-0 text-xs leading-5 text-[#a1a1aa] sm:text-sm">
        {appointment.service}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-xs text-[#71717a] transition hover:text-[#9b87ff] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#9b87ff]"
          aria-label={`Editar agendamento de ${appointment.petName}`}
        >
          <Pencil className="size-3.5 sm:hidden" />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onRemove(appointment.id)}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-xs text-[#71717a] transition hover:text-[#f87171] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#9b87ff]"
          aria-label={`Remover agendamento de ${appointment.petName}`}
        >
          <Trash2 className="size-3.5 sm:hidden" />
          Remover
        </button>
      </div>
    </li>
  );
}
