import type { LucideIcon } from "lucide-react";
import type { Appointment, Period } from "@/types/appointment";
import { AppointmentItem } from "./appointment-item";

type PeriodCardProps = {
  period: Period;
  title: string;
  timeRange: string;
  icon: LucideIcon;
  iconClassName: string;
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onRemove: (id: string) => void;
};

export function PeriodCard({
  title,
  timeRange,
  icon: Icon,
  iconClassName,
  appointments,
  onEdit,
  onRemove,
}: PeriodCardProps) {
  return (
    <section className="overflow-hidden rounded-lg bg-surface-3 shadow-[0_16px_50px_rgba(0,0,0,0.20)]">
      <header className="flex h-12 items-center justify-between border-b border-bd-muted/70 px-5 sm:px-7">
        <div className="flex items-center gap-3">
          <Icon
            className={`size-4 ${iconClassName}`}
            fill="currentColor"
            strokeWidth={2.4}
          />
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        <span className="text-sm font-bold text-muted">{timeRange}</span>
      </header>

      {appointments.length > 0 ? (
        <ul>
          {appointments.map((appointment) => (
            <AppointmentItem
              key={appointment.id}
              appointment={appointment}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : (
        <p className="border-t border-bd-muted/60 px-5 py-6 text-sm text-placeholder sm:px-7">
          Nenhum agendamento neste periodo.
        </p>
      )}
    </section>
  );
}
