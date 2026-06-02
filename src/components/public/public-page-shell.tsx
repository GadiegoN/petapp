import { RoleNavigation } from "@/components/navigation/role-navigation";

type PublicPageShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function PublicPageShell({
  title,
  description,
  children,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <RoleNavigation />

      <main className="mx-auto w-full max-w-260 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 max-w-180 text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
