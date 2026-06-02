import type { LucideIcon } from "lucide-react";

type AdminMetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  detail?: string;
};

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  detail,
}: AdminMetricCardProps) {
  return (
    <section className="rounded-lg border border-bd-muted bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-muted">{label}</span>
        <span className="grid size-9 place-items-center rounded-md bg-surface-2 text-accent">
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      {detail ? (
        <p className="mt-2 text-xs text-placeholder">{detail}</p>
      ) : null}
    </section>
  );
}
