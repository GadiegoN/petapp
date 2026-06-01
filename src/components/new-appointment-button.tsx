import { Plus } from "lucide-react";

type NewAppointmentButtonProps = {
  onClick: () => void;
};

export function NewAppointmentButton({ onClick }: NewAppointmentButtonProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4 sm:inset-x-auto sm:right-7 sm:justify-end">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#9b87ff] px-6 text-sm font-black text-[#070711] shadow-[0_0_50px_rgba(155,135,255,0.35)] transition hover:bg-[#aa9aff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c4b8ff]"
      >
        <Plus className="size-4" strokeWidth={3} />
        NOVO AGENDAMENTO
      </button>
    </div>
  );
}
