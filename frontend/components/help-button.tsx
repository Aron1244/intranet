"use client";

import { useCallback } from "react";
import { HelpCircle } from "lucide-react";

import { startHelpTour, type HelpTourId } from "@/lib/help-tours";
import { cn } from "@/lib/cn";

export function HelpButton({
  tourId,
  label,
  variant = "inline",
  className,
}: {
  tourId: HelpTourId;
  label?: string;
  variant?: "inline" | "floating";
  className?: string;
}) {
  const handleClick = useCallback(() => {
    startHelpTour(tourId);
  }, [tourId]);

  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition",
    "hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    "active:scale-[0.96]",
    variant === "floating"
      ? "fixed bottom-5 right-5 z-30 h-12 w-12 shadow-[var(--shadow-lg)]"
      : "h-10 w-10",
    className,
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label ?? "Mostrar ayuda de esta vista"}
      title={label ?? "Mostrar ayuda"}
      data-tour-help-trigger={tourId}
      className={baseClasses}
    >
      <HelpCircle className={cn(variant === "floating" ? "h-5 w-5" : "h-4 w-4")} />
      {variant === "floating" ? (
        <span className="sr-only">Ayuda</span>
      ) : null}
    </button>
  );
}