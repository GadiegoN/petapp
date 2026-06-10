"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

type DialogProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({
  isOpen,
  title,
  description,
  onClose,
  children,
}: DialogProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-background/70 px-4 py-8 backdrop-blur-md"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="relative w-full max-w-88 rounded-xl bg-surface-3 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:max-w-116 sm:p-8 overflow-y-auto max-h-[90vh]"
      >
        <Button
          onClick={onClose}
          aria-label="Fechar modal"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-muted hover:text-white"
          icon={<X className="size-5" />}
        />

        <div className="mb-6 pr-8">
          <h2 className="text-xl font-bold text-white leading-normal">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-5 text-muted">{description}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
