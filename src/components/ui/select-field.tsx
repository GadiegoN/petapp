import type { SelectHTMLAttributes } from "react";

type OptionItem = string | { value: string; label: string };

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: OptionItem[];
};

export function SelectField({
  label,
  options,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-white">{label}</span>
      <select
        {...props}
        className={`h-11 w-full rounded-md border border-bd-muted bg-surface-4 px-3 text-sm text-white outline-none transition focus:border-accent ${className}`}
      >
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
    </label>
  );
}
