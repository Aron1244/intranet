"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/cn";

export function DashboardHeader() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/80 px-5 py-3 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative hidden flex-1 sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              placeholder="Buscar personas, documentos, conversaciones..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className={cn(
                "h-10 w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-16 text-sm",
                "text-[var(--foreground)] outline-none transition",
                "placeholder:text-[var(--muted-soft)]",
                "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]",
              )}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Notificaciones"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] active:scale-[0.97]"
            >
              <Bell className="h-4 w-4" />
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-[var(--danger)]"
              />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
}

function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="absolute top-0 left-0 h-full w-[280px] border-r border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xl)]">
        <BrandMark />
        <p className="mt-6 text-xs text-[var(--muted)]">
          La navegacion mobile completa se entregara en la siguiente iteracion.
        </p>
      </div>
    </div>
  );
}