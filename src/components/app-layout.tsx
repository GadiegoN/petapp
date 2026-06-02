import type { ReactNode } from "react";
import { RoleNavigation } from "@/components/navigation/role-navigation";

type AppLayoutProps = {
  children: ReactNode;
  showNavigation?: boolean;
};

export function AppLayout({ children, showNavigation = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-fg">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_95%,rgba(155,135,255,0.20),transparent_22rem)]" />
      <div className="relative min-h-screen pb-28">
        {showNavigation ? <RoleNavigation /> : null}
        {children}
      </div>
    </div>
  );
}
