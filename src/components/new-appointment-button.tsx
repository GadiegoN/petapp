import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type NewAppointmentButtonProps = {
  onClick: () => void;
};

export function NewAppointmentButton({ onClick }: NewAppointmentButtonProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4 sm:inset-x-auto sm:right-7 sm:justify-end">
      <Button
        onClick={onClick}
        variant="primary"
        size="lg"
        className="rounded-lg px-6 shadow-[0_0_50px_rgba(155,135,255,0.35)]"
        icon={<Plus className="size-4 uppercase" strokeWidth={3} />}
      >
        Novo agendamento
      </Button>
    </div>
  );
}
