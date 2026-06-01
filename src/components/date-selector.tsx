import { CalendarDays } from "lucide-react";

type DateSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DateSelector({ value, onChange }: DateSelectorProps) {
  return (
    <label className="relative flex h-11 w-full items-center rounded-lg border border-[#30313d] bg-[#171821] text-sm text-[#a1a1aa] shadow-sm sm:w-40">
      <CalendarDays className="pointer-events-none absolute left-3 size-4 text-[#9b87ff]" />
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Selecionar data"
        className="h-full w-full rounded-lg bg-transparent pl-9 pr-3 text-[#a1a1aa] outline-none [color-scheme:dark]"
      />
    </label>
  );
}
