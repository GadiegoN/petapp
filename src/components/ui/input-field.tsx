import type { InputHTMLAttributes, ReactNode } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
};

export function InputField({
  label,
  icon,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-white">{label}</span>
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-accent">
            {icon}
          </span>
        ) : null}
        <input
          {...props}
          className={`h-11 w-full rounded-md border border-bd-muted bg-surface-4 px-3 text-sm text-white outline-none transition placeholder:text-placeholder focus:border-accent ${icon ? "pl-9" : ""} ${className}`}
        />
      </span>
    </label>
  );
}
