"use client";

import { Menu, Search, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/cn";
import { useMobileNav } from "@/lib/use-mobile-nav";

type DashboardHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Texto con el alcance del filtro, ej. "3 publicaciones". */
  searchSummary?: string;
};

export function DashboardHeader({
  searchValue,
  onSearchChange,
  searchSummary,
}: DashboardHeaderProps) {
  const hasQuery = searchValue.trim().length > 0;
  const { isOpen: isNavOpen, toggle: toggleNav } = useMobileNav();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/80 px-5 py-3 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleNav}
          aria-label="Abrir navegacion"
          aria-expanded={isNavOpen}
          aria-controls="mobile-nav-drawer"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
          <BrandMark size="sm" />
        </div>

        <div className="relative hidden min-w-0 flex-1 sm:block">
          <label htmlFor="dashboard-search" className="sr-only">
            Buscar en el resumen
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="dashboard-search"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar publicaciones, conversaciones y autores..."
            className={cn(
              "h-10 w-full max-w-xl rounded-[var(--radius-md)] border bg-[var(--surface)] pr-24 pl-9 text-sm",
              "text-[var(--foreground)] outline-none transition",
              "placeholder:text-[var(--muted-soft)]",
              hasQuery
                ? "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]"
                : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]",
            )}
          />

          {hasQuery ? (
            <span className="absolute top-1/2 right-3 -translate-y-1/2">
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Limpiar busqueda"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
              >
                {searchSummary ?? "0 resultados"}
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}