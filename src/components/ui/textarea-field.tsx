import type { TextareaHTMLAttributes } from "react";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextareaField({ label, className = "", ...props }: TextareaFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-white">{label}</span>
      <textarea
        {...props}
        className={`min-h-24 w-full resize-none rounded-md border border-[#30313d] bg-[#23242c] px-3 py-3 text-sm text-white outline-none transition placeholder:text-[#71717a] focus:border-[#9b87ff] ${className}`}
      />
    </label>
  );
}
