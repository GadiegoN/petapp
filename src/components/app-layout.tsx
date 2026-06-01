import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#101018] text-[#f5f5f7]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_95%,rgba(155,135,255,0.20),transparent_22rem)]" />
      <div className="relative min-h-screen pb-28">{children}</div>
    </div>
  );
}
