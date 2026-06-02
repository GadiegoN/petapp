type AdminEmptyStateProps = {
  title: string;
  description: string;
};

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <section className="rounded-lg border border-bd-muted bg-surface px-4 py-8 text-center">
      <h2 className="text-base font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-120 text-sm leading-6 text-muted">
        {description}
      </p>
    </section>
  );
}
