"use client";

import { AppLayout } from "@/components/app-layout";
import { AdminGuard } from "./admin-guard";
import { AdminShell } from "./admin-shell";

type AdminPageFrameProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminPageFrame({
  title,
  description,
  children,
}: AdminPageFrameProps) {
  return (
    <AdminGuard>
      <AppLayout showNavigation>
        <AdminShell title={title} description={description}>
          {children}
        </AdminShell>
      </AppLayout>
    </AdminGuard>
  );
}
