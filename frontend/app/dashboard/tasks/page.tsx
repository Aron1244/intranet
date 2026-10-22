"use client";

import { useEffect, useState } from "react";
import { Construction, Lock } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { isAdministrator, isLeader, isNewHire } from "@/lib/roles";

type MeResponse = {
  data: {
    id: number;
    name: string;
    email: string;
    department_id?: number | null;
    es_lider?: boolean;
    onboarding_pendiente?: boolean;
    roles?: Array<{
      id: number;
      name: string;
    }>;
  };
};

/**
 * Columnas del tablero. Se muestran en estado atenuado: el módulo todavía no
 * tiene backend, así que no hay conteos reales que mostrar y los mensajes no
 * deben insinuar que el tablero está operativo.
 */
const KANBAN_COLUMNS = ["Pendiente", "En curso", "En revisión", "Completado"] as const;

export default function TasksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadMe = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiFetch<MeResponse>("/me", { method: "GET" });

        if (!ignore) {
          setUser(response.data);
          // El administrador también entra: antes la condición lo excluía
          // explicitamente y leia "contacta al administrador" a si mismo.
          setHasAccess(isAdministrator(response.data) || isLeader(response.data));
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          setErrorMessage("No autenticado. Inicia sesión nuevamente.");
          clearAccessToken();
        } else if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("No se pudo validar la sesión.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadMe();

    return () => {
      ignore = true;
    };
  }, []);

  const isAdmin = isAdministrator(user);
  const isUserLeader = isLeader(user);
  const isUserNewHire = isNewHire(user);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="flex min-h-screen w-full">
        <DashboardSidebar
          user={user ? { name: user.name, email: user.email } : null}
          isAdmin={isAdmin}
          isLeader={isUserLeader}
          isNewHire={isUserNewHire}
          activeRoute="tasks"
          statusMessage={isLoading ? "Validando sesión..." : errorMessage ?? "Sesión activa"}
        />

        <section className="min-w-0 flex-1 px-5 py-6 lg:px-6 xl:px-8">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
            <header className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                Tareas
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Tablero de tu equipo
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Organiza el trabajo por etapas: pendiente, en curso, en revisión y completado.
              </p>
            </header>

            {!isLoading && !hasAccess ? (
              <article className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-4 py-3 text-sm text-[color:var(--warning)]">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  El tablero está disponible para líderes de equipo. Si necesitas escribir tareas,
                  pide a un administrador que te asigne ese rol.
                </p>
              </article>
            ) : null}

            {hasAccess ? (
              <>
                <article className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/60 px-4 py-3 text-sm text-[var(--foreground)]">
                  <Construction className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                  <p>
                    Este módulo todavía no está habilitado. El tablero se pondrá en marcha cuando
                    se active el seguimiento de tareas; las columnas de abajo muestran el flujo
                    previsto.
                  </p>
                </article>

                <section
                  aria-label="Flujo del tablero"
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                  {KANBAN_COLUMNS.map((column) => (
                    <article
                      key={column}
                      className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/50 p-4"
                    >
                      <header className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-soft)]" aria-hidden="true" />
                        <h3 className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                          {column}
                        </h3>
                      </header>
                      <p className="mt-4 text-xs text-[var(--muted-soft)]">Sin conexión por ahora</p>
                    </article>
                  ))}
                </section>
              </>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}