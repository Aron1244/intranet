"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export type DepartmentSelectOption = {
  value: string;
  label: string;
  color?: string | null;
};

type DepartmentSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: DepartmentSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * Desplegable de departamento con punto de color.
 *
 * El <select> nativo no sirve para esto: la lista abierta la dibuja el sistema
 * operativo, fuera del DOM, asi que ningun CSS alcanza a las opciones. Para
 * mostrar el color del departamento hay que sustituir el control por uno propio.
 *
 * Sustituye al <select> sin añadir libreria extra: la navegacion por teclado, el
 * patron ARIA combobox/listbox y el cierre al hacer clic fuera estan
 * implementados aqui.
 */
export function DepartmentSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecciona un departamento",
  disabled = false,
  className,
  ariaLabel,
}: DepartmentSelectProps) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const openList = useCallback(() => {
    if (disabled) {
      return;
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }, [disabled, selectedIndex]);

  const closeList = useCallback((restoreFocus = true) => {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];

      if (option) {
        onChange(option.value);
      }

      closeList();
    },
    [closeList, onChange, options],
  );

  // Cierre al hacer clic fuera del control.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Mantiene visible la opcion activa mientras se navega con el teclado.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0) {
      return;
    }

    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openList();
      }

      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + options.length) % options.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectIndex(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeList();
        break;
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-activedescendant={
          isOpen ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (isOpen ? closeList(false) : openList())}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-left text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-soft)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.color ? (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: selectedOption.color }}
            />
          ) : null}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? "Departamentos"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-lg)]"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition",
                    isActive
                      ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                      : "text-[var(--foreground)]",
                  )}
                >
                  {option.color ? (
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: option.color }}
                    />
                  ) : (
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
                  )}

                  <span className="min-w-0 flex-1 truncate">{option.label}</span>

                  {isSelected ? (
                    <Check
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]"
                    />
                  ) : null}
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
