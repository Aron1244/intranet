"use client";

import { useSyncExternalStore } from "react";

import {
  closeMobileNav as closeStore,
  getMobileNavOpen,
  openMobileNav as openStore,
  subscribe as subscribeStore,
  toggleMobileNav as toggleStore,
} from "@/lib/mobile-nav-store";

/**
 * Estado del drawer de navegación móvil.
 *
 * Vive en un store de módulo (igual que `theme-provider`) para que el botón que
 * lo abre, en el header, y el drawer que lo pinta, en el sidebar, puedan estar
 * en componentes distintos sin que cada página tenga que cablear el estado.
 */
export function useMobileNav() {
  const isOpen = useSyncExternalStore(
    subscribeStore,
    getMobileNavOpen,
    getMobileNavOpen,
  );

  return {
    isOpen,
    open: openStore,
    close: closeStore,
    toggle: toggleStore,
  };
}