import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "warning"
  | "icon"
  | "link";

type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "cursor-pointer bg-accent text-accent-contrast hover:bg-accent-2 focus-visible:outline-accent-3",
  secondary:
    "cursor-pointer border border-bd-muted bg-surface-2 text-fg hover:border-accent hover:text-accent focus-visible:outline-accent",
  outline:
    "cursor-pointer border border-bd-muted bg-transparent text-fg hover:border-accent hover:text-accent focus-visible:outline-accent",
  ghost:
    "cursor-pointer bg-transparent text-fg hover:bg-surface-2 hover:text-accent focus-visible:outline-accent",
  danger:
    "cursor-pointer border border-error bg-error-bg text-error-light hover:border-red-500 focus-visible:outline-error-light",
  success:
    "cursor-pointer bg-emerald-500 text-emerald-950 hover:bg-emerald-400 focus-visible:outline-emerald-200",
  warning:
    "cursor-pointer border border-warning-border bg-warning-bg text-warning hover:border-warning focus-visible:outline-warning",
  icon: "cursor-pointer border border-bd-muted bg-surface-2 text-fg hover:border-accent hover:text-accent focus-visible:outline-accent",
  link: "cursor-pointer bg-transparent text-accent hover:text-accent-2 focus-visible:outline-accent",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-3 text-xs",
  lg: "h-11 px-4 text-sm",
  icon: "size-9 p-0",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function buttonClassName({
  variant = "secondary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return `inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClassNames[variant]} ${sizeClassNames[size]} ${className}`;
}
