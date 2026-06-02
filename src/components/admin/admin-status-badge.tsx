type AdminStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneClassNames = {
  neutral:
    "border-status-neutral-border bg-status-neutral-bg text-status-neutral",
  success:
    "border-status-success-border bg-status-success-bg text-status-success",
  warning:
    "border-status-warning-border bg-status-warning-bg text-status-warning",
  danger: "border-status-danger-border bg-status-danger-bg text-status-danger",
};

export function AdminStatusBadge({
  label,
  tone = "neutral",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-bold ${toneClassNames[tone]}`}
    >
      {label}
    </span>
  );
}
