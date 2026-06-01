import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
};

export function SelectField({ label, options, className = "", ...props }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-white">{label}</span>
      <select
        {...props}
        className={`h-11 w-full rounded-md border border-[#30313d] bg-[#23242c] px-3 text-sm text-white outline-none transition focus:border-[#9b87ff] ${className}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
