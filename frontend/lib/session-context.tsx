"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { ApiClientError, apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-token";
import type { UserRole } from "@/lib/roles";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  department_id?: number | null;
  department_ids?: number[];
  es_lider?: boolean;
  onboarding_pendiente?: boolean;
  can_manage_announcements?: boolean;
  roles?: UserRole[];
};

type SessionValue = {
  user: SessionUser | null;
  isLoading: boolean;
  errorMessage: string | null;
  /**
   * Publica un usuario ya resuelto. El login lo usa con la respuesta de
   * GET /me que ya hace: así el dashboard arranca con la sesión resuelta y
   * el sidebar nunca dibuja "Invitado".
   */
  setUser: (user: SessionUser | null) => void;
};

const SessionContext = createContext<SessionValue>({
  user: null,
  isLoading: true,
  errorMessage: null,
  setUser: () => {},
});

/**
 * Sesión compartida de la app.
 *
 * Antes cada página pedía /me por su cuenta y el sidebar recibía los roles
 * como props: al navegar, la página nueva montaba con user = null, el sidebar
 * se redibujaba sin items de rol y un instante después aparecían (con
 * "Invitado" y "Sin sesión" en el bloque del usuario).
 *
 * Con este provider la sesión vive en el layout raíz, que no se desmonta al
 * navegar, así que el sidebar siempre dibuja con los datos definitivos. El
 * login publica el usuario que ya resolvió y el dashboard arranca sin parpadeo.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      return;
    }

    let ignore = false;

    apiFetch<{ data: SessionUser }>("/me", { method: "GET" })
      .then((response) => {
        if (ignore) {
          return;
        }

        setUser(response.data);
        setErrorMessage(null);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "No se pudo validar la sesión.",
        );
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, errorMessage, setUser }),
    [user, isLoading, errorMessage],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
