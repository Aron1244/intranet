"use client";

import { useEffect, useState } from "react";

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

const KANBAN_COLUMNS: Array<{
  title: string;
  tone: string;
  emptyMessage: string;
}> = [
  {
    title: "Pendiente",
    tone: "border-slate-200 bg-slate-50/60 text-slate-700",
    emptyMessage: "Sin tareas pendientes",
  },
  {
    title: "En curso",
    tone: "border-sky-200 bg-sky-50/60 text-sky-800",
    emptyMessage: "Sin tareas en curso",
  },
  {
    title: "En revision",
    tone: "border-amber-200 bg-amber-50/60 text-amber-800",
    emptyMessage: "Sin tareas en revision",
  },
  {
    title: "Completado",
    tone: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
    emptyMessage: "Aun no hay tareas completadas",
  },
];

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
          const allowed = isLeader(response.data) && !isAdministrator(response.data);
          setHasAccess(allowed);
        }
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiClientError && error.status === 401) {
            setErrorMessage("No autenticado. Inicia sesion nuevamente.");
            clearAccessToken();
          } else if (error instanceof ApiClientError) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage("No se pudo validar la sesion.");
          }
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
    <div className="min-h-screen bg-intra-ligth">
      <main className="flex min-h-screen w-full">
        <DashboardSidebar
          user={user ? { name: user.name, email: user.email } : null}
          isAdmin={isAdmin}
          isLeader={isUserLeader}
          isNewHire={isUserNewHire}
          activeRoute="tasks"
          statusMessage={isLoading ? "Validando sesion..." : errorMessage ? errorMessage : "Tareas sincronizadas"}
        />

        <section className="min-w-0 flex-1 px-5 py-6 lg:px-6 xl:px-8">
          <div className="space-y-6">
            <header className="rounded-3xl border border-intra-border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-[0.18em] text-intra-accent uppercase">Tareas</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-intra-secondary">
                Tablero de tu equipo
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-intra-secondary/70">
                Vista estilo Kanban con el flujo Pendiente, En curso, En revision y Completado.
                El backend para esta tarjeta se entregara en una iteracion posterior (MOD-001).
              </p>
            </header>

            {!isLoading && !hasAccess ? (
              <article className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                Esta vista es exclusiva para usuarios con el rol &quot;Lider&quot;. Si crees que deberia
                estar disponible para ti, contacta al administrador.
              </article>
            ) : null}

            {hasAccess ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {KANBAN_COLUMNS.map((column) => (
                  <article
                    key={column.title}
                    className={`rounded-3xl border p-4 ${column.tone}`}
                  >
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide">{column.title}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">0</span>
                    </header>
                    <p className="mt-6 text-xs">{column.emptyMessage}</p>
                  </article>
                ))}
              </section>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}