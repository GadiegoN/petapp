"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--surface)",
          borderColor: "var(--bd-muted)",
          color: "var(--foreground)",
        },
      }}
    />
  );
}
