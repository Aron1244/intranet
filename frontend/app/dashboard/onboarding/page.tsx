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

const ONBOARDING_STEPS: Array<{
  title: string;
  description: string;
  status: "done" | "pending";
}> = [
  {
    title: "Configura tu perfil",
    description: "Verifica tu correo, agrega una foto y completa tu cargo y departamento.",
    status: "done",
  },
  {
    title: "Conoce a tu equipo",
    description: "Revisa el directorio y envía un mensaje de presentación en Conversaciones.",
    status: "pending",
  },
  {
    title: "Lee la documentación clave",
    description: "Abre los documentos marcados como &quot;onboarding&quot; en la biblioteca del departamento.",
    status: "pending",
  },
  {
    title: "Confirma con tu líder",
    description: "Cuando completes estos pasos, avisa a tu líder para cerrar tu onboarding.",
    status: "pending",
  },
];

export default function OnboardingPage() {
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
          setHasAccess(isNewHire(response.data));
        }
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiClientError && error.status === 401) {
            setErrorMessage("No autenticado. Inicia sesión nuevamente.");
            clearAccessToken();
          } else if (error instanceof ApiClientError) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage("No se pudo validar la sesión.");
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
          canManageAnnouncements={Boolean(user?.can_manage_announcements)}
          activeRoute="onboarding"
          statusMessage={isLoading ? "Validando sesión..." : errorMessage ? errorMessage : "Panel de Novedades"}
        />

        <section className="min-w-0 flex-1 px-5 py-6 lg:px-6 xl:px-8">
          <div className="space-y-6">
            <header className="rounded-3xl border border-intra-primary/40 bg-gradient-to-br from-intra-primary/15 to-intra-accent/10 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                <p className="text-xs font-semibold tracking-[0.18em] text-intra-accent uppercase">
                  Panel de Novedades
                </p>
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-intra-secondary">
                Bienvenido al equipo
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-intra-secondary/75">
                Sigue estos pasos para completar tu onboarding. Este panel desaparece cuando tu
                líder marca la tarea de bienvenida como finalizada.
              </p>
            </header>

            {!isLoading && !hasAccess ? (
              <article className="rounded-3xl border border-intra-border bg-white px-4 py-3 text-sm text-intra-secondary/70 shadow-sm">
                No hay pasos pendientes para tu cuenta. Si necesitas acompañamiento adicional,
                contacta a tu líder o al administrador.
              </article>
            ) : null}

            {hasAccess ? (
              <section className="space-y-3">
                {ONBOARDING_STEPS.map((step, index) => (
                  <article
                    key={step.title}
                    className={`rounded-2xl border p-5 shadow-sm ${
                      step.status === "done"
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-intra-border bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          step.status === "done"
                            ? "bg-emerald-600 text-white"
                            : "bg-intra-primary/15 text-intra-primary"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-intra-secondary">{step.title}</h3>
                        <p className="mt-1 text-sm text-intra-secondary/70">{step.description}</p>
                        <p
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            step.status === "done"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {step.status === "done" ? "Completado" : "Pendiente"}
                        </p>
                      </div>
                    </div>
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