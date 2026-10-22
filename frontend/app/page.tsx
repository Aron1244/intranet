"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { apiFetch, ApiClientError } from "@/lib/api-client";
import { saveAccessToken } from "@/lib/auth-token";
import { cn } from "@/lib/cn";

import { BrandMark } from "@/components/brand-mark";

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

type FieldErrors = {
  email?: string;
  password?: string;
};

type LaravelValidationErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

const HIGHLIGHTS = [
  {
    icon: MessageSquare,
    title: "Mensajería en vivo",
    body: "Conversaciones sincronizadas en tiempo real con Laravel Echo y Reverb.",
  },
  {
    icon: ShieldCheck,
    title: "Permisos por rol",
    body: "Cada módulo sabe qué puede ver y qué puede editar tu rol.",
  },
  {
    icon: Sparkles,
    title: "Onboarding guiado",
    body: "Recorridos interactivos para que ningún ingreso empiece en cero.",
  },
];

const STATS = [
  { label: "Módulos internos", value: "8" },
  { label: "Roles de acceso", value: "4" },
  { label: "Rutas autenticadas", value: "100%" },
];

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    setFieldErrors({});

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
        setFieldErrors({
          email: payload.errors?.email?.[0],
          password: payload.errors?.password?.[0],
        });
        setErrorMessage(payload.message ?? "Revisa los datos e intenta de nuevo.");
      } else if (error instanceof ApiClientError && error.status === 429) {
        setErrorMessage(
          "Demasiados intentos. Espera un minuto antes de volver a entrar.",
        );
      } else if (error instanceof ApiClientError && error.status === 401) {
        setErrorMessage("Credenciales inválidas. Verifica tu correo y tu contraseña.");
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No pudimos iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <BackdropDecor />

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1400px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[1.05fr_0.95fr]">
        <BrandPanel />

        <section className="relative flex min-w-0 items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="surface-card w-full max-w-md p-7 sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
              Acceso seguro
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[2rem]">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Ingresa con tus credenciales corporativas para continuar donde lo dejaste.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <Field
                id="email"
                label="Correo corporativo"
                type="email"
                placeholder="nombre@empresa.com"
                autoComplete="email"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                icon={Mail}
                isValid={emailValid}
                error={fieldErrors.email}
              />

              <Field
                id="password"
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                autoComplete="current-password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                icon={Lock}
                isValid={passwordValid}
                error={fieldErrors.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

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
                      "h-5 w-5 rounded-[var(--radius-sm)] border border-[var(--border-strong)] transition",
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
                Mantener sesión iniciada en este equipo
              </label>

              <AnimatePresence initial={false} mode="wait">
                {errorMessage ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    role="alert"
                    className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-3.5 py-2.5 text-sm text-[color:var(--danger)]"
                  >
                    {errorMessage}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting || !formReady}
                className={cn(
                  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-semibold transition",
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
                    Entrar a Coherev
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-relaxed tracking-wide text-[var(--muted-soft)] uppercase">
              Acceso restringido a personal autorizado
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden min-w-0 flex-col justify-between overflow-hidden p-8 lg:flex lg:p-12">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--panel-from), var(--panel-to))",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 8%, rgba(255,255,255,0.35), transparent 38%), radial-gradient(circle at 82% 82%, rgba(255,255,255,0.22), transparent 42%)",
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/[0.06] blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "var(--panel-glow)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <BrandMark tone="light" size="lg" />
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] text-white uppercase backdrop-blur-sm">
            Coherev
          </span>
        </div>

        <p className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] text-white uppercase backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
          Centro de operaciones
        </p>

        <h2 className="mt-6 max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
          Todo lo que tu equipo comparte, en un solo lugar.
        </h2>

        <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
          Conversaciones, publicaciones y documentos accesibles solo para tu equipo, con
          permisos claros según el rol que tienes.
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-[var(--radius-lg)] border border-white/15 bg-white/10 p-4 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15"
            >
              <Icon className="h-4 w-4 text-white/90" />
              <p className="mt-3 text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/85">{body}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 block text-xs tracking-wide text-white/80 uppercase">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="relative z-10 mt-12 text-[11px] tracking-wide text-white/80 uppercase">
        Portal interno Coherev
      </p>
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
          maskImage: "radial-gradient(ellipse at top, black 35%, transparent 70%)",
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
}: FieldProps) {
  const hasError = Boolean(error);
  const showSuccess = isValid && !hasError && value.length > 0;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>

      <div
        className={cn(
          "group relative flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--surface-muted)] px-3.5 transition",
          hasError
            ? "border-[color:var(--danger)]/50 focus-within:border-[color:var(--danger)]"
            : "border-[var(--border)] focus-within:border-[var(--primary)] focus-within:bg-[var(--surface)]",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition",
            hasError
              ? "text-[color:var(--danger)]"
              : "text-[var(--muted)] group-focus-within:text-[var(--primary)]",
          )}
        />
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-soft)]"
        />
        {showSuccess ? (
          <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--success)]" />
        ) : null}
        {trailing}
      </div>

      {hasError ? (
        <p id={errorId} className="text-xs text-[color:var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}