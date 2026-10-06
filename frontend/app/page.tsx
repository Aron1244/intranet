"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { API_BASE, ApiClientError, apiFetch } from "@/lib/api-client";
import { saveAccessToken } from "@/lib/auth-token";
import { cn } from "@/lib/cn";

import { BrandMark } from "@/components/brand-mark";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion-primitives";

type LoginResponse = {
  message: string;
  token_type: "Bearer";
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type MeResponse = {
  data: {
    id: number;
    name: string;
    email: string;
  };
};

type LaravelValidationErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "Sesiones cifradas",
    body: "Tokens Bearer con Sanctum y expiracion automatica.",
  },
  {
    icon: Sparkles,
    title: "Onboarding guiado",
    body: "Recorridos interactivos con driver.js para nuevos miembros.",
  },
  {
    icon: Mail,
    title: "Mensajeria en vivo",
    body: "Conversaciones sincronizadas con Laravel Echo y Reverb.",
  },
];

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const passwordValid = password.length >= 6;
  const formReady = emailValid && passwordValid;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formReady || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const loginPayload = await apiFetch<LoginResponse>("/login", {
        method: "POST",
        auth: false,
        body: {
          email,
          password,
          device_name: "nextjs-client",
        },
      });

      saveAccessToken(loginPayload.access_token, remember);

      const currentUser = await apiFetch<MeResponse>("/me", {
        method: "GET",
      });

      if (currentUser.data.id) {
        router.push("/dashboard");
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 422) {
        const payload = error.payload as LaravelValidationErrorPayload;
        const firstFieldError = payload.errors
          ? Object.values(payload.errors)[0]?.[0]
          : undefined;
        setErrorMessage(firstFieldError ?? payload.message ?? "No fue posible iniciar sesion.");
      } else if (error instanceof ApiClientError && error.status === 401) {
        setErrorMessage("Credenciales invalidas. Verifica email y contrasena.");
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Error inesperado al iniciar sesion.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <BackdropDecor />

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[1.15fr_0.95fr]">
        <BrandPanel />

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <Reveal className="w-full max-w-md" y={20}>
            <div className="surface-card p-7 sm:p-8">
              <div className="mb-8 flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
                  Acceso seguro
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] transition hover:text-[var(--primary)]"
                >
                  Necesito ayuda
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
                Bienvenido de vuelta
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Ingresa con tus credenciales corporativas para continuar donde lo dejaste.
              </p>

              <StaggerGroup className="mt-8 space-y-5" stagger={0.08}>
                <StaggerItem>
                  <Field
                    id="email"
                    label="Correo corporativo"
                    type="email"
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    icon={Mail}
                    isValid={emailValid}
                    error={null}
                  />
                </StaggerItem>

                <StaggerItem>
                  <Field
                    id="password"
                    label="Contrasena"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                    icon={Lock}
                    isValid={passwordValid}
                    error={null}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
                        aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    hint={
                      <Link
                        href="#"
                        className="text-xs font-medium text-[var(--primary)] hover:underline"
                      >
                        Olvide mi contrasena
                      </Link>
                    }
                  />
                </StaggerItem>

                <StaggerItem>
                  <label className="group flex cursor-pointer items-center gap-3 text-sm text-[var(--muted)]">
                    <span className="relative inline-flex">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-5 w-5 rounded-md border border-[var(--border-strong)] transition",
                          "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--surface)]",
                          remember
                            ? "border-[var(--primary)] bg-[var(--primary)]"
                            : "bg-[var(--surface)] group-hover:border-[var(--primary)]",
                        )}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className={cn(
                            "absolute inset-0 m-auto h-3 w-3 text-white transition",
                            remember ? "scale-100 opacity-100" : "scale-50 opacity-0",
                          )}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 8.5 6.5 12 13 4.5" />
                        </svg>
                      </span>
                    </span>
                    Mantener sesion iniciada en este equipo
                  </label>
                </StaggerItem>

                <AnimatePresence initial={false} mode="wait">
                  {errorMessage ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      role="alert"
                      className="rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-3.5 py-2.5 text-sm text-[color:var(--danger)]"
                    >
                      {errorMessage}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <StaggerItem>
                  <button
                    type="submit"
                    form="login-form"
                    disabled={isSubmitting || !formReady}
                    className={cn(
                      "group relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition",
                      "bg-[var(--primary)] text-white shadow-[0_18px_30px_-18px_var(--primary-glow)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                      "active:scale-[0.985]",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      <>
                        Entrar a la intranet
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </StaggerItem>
              </StaggerGroup>

              <form id="login-form" onSubmit={handleSubmit} className="hidden" aria-hidden="true" />

              <p className="mt-6 text-center text-[11px] tracking-wide text-[var(--muted-soft)] uppercase">
                API activa · {API_BASE.replace(/^https?:\/\//, "")}
              </p>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden p-8 lg:flex lg:p-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[color:var(--primary)] to-[color:var(--primary-hover)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.5), transparent 35%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.35), transparent 40%)",
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--accent)]/30 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between text-white">
        <BrandMark />
        <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] uppercase backdrop-blur-sm">
          Intranet v3
        </span>
      </div>

      <div className="relative z-10 mt-12 max-w-xl text-white">
        <Reveal delay={0.05}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
            Centro de operaciones
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl xl:text-[3.4rem]">
            Tu centro de trabajo interno,
            <br />
            <span className="text-white/85">redefinido en un solo lugar.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
            Documentos, conversaciones y herramientas del equipo con una experiencia
            segura, rapida y consistente en cualquier dispositivo.
          </p>
        </Reveal>

        <StaggerGroup className="mt-10 grid gap-3 sm:grid-cols-3" stagger={0.1}>
          {highlights.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15">
                <Icon className="h-4 w-4 text-white/90" />
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <StaggerGroup className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6" stagger={0.08}>
          {[
            { label: "Disponibilidad", value: "24/7" },
            { label: "Modulos internos", value: "+40" },
            { label: "Acceso autenticado", value: "100%" },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs tracking-wide text-white/70 uppercase">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      <div className="relative z-10 mt-12 flex items-center justify-between text-[11px] tracking-wide text-white/70 uppercase">
        <span>SOC2 · ISO 27001</span>
        <span>Soporte 24/7</span>
      </div>
    </aside>
  );
}

function BackdropDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[var(--primary-soft)] blur-3xl" />
      <div className="absolute right-0 h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at top, black 35%, transparent 70%)",
        }}
      />
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  isValid?: boolean;
  error?: string | null;
  trailing?: React.ReactNode;
  hint?: React.ReactNode;
};

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
  icon: Icon,
  isValid,
  error,
  trailing,
  hint,
}: FieldProps) {
  const hasError = Boolean(error);
  const showSuccess = isValid && !hasError && value.length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
        {hint}
      </div>

      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border bg-[var(--surface-muted)] px-3.5 transition",
          hasError
            ? "border-[color:var(--danger)]/50 focus-within:border-[color:var(--danger)]"
            : "border-[var(--border)] focus-within:border-[var(--primary)] focus-within:bg-[var(--surface)]",
        )}
      >
        <Icon className="h-4 w-4 text-[var(--muted)] transition group-focus-within:text-[var(--primary)]" />
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-soft)]"
        />
        {showSuccess ? (
          <span aria-hidden="true" className="text-[var(--success)]">
            <ShieldCheck className="h-4 w-4" />
          </span>
        ) : null}
        {trailing}
      </div>

      {hasError ? (
        <p className="text-xs text-[color:var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}