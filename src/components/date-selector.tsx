import { CalendarDays } from "lucide-react";

type DateSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DateSelector({ value, onChange }: DateSelectorProps) {
  return (
    <label className="relative flex h-11 w-full items-center rounded-lg border border-bd-muted bg-surface-5 text-sm text-muted shadow-sm sm:w-40">
      <CalendarDays className="pointer-events-none absolute left-3 size-4 text-accent" />
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Selecionar data"
        className="h-full w-full rounded-lg bg-transparent pl-9 pr-3 text-muted outline-none "
      />
    </label>
  );
}
