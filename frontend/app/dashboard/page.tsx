"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Flame,
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { HelpButton } from "@/components/help-button";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { isAdministrator, isLeader, isNewHire } from "@/lib/roles";
import { cn } from "@/lib/cn";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion-primitives";
import { Skeleton } from "@/components/skeleton";

type MeResponse = {
  data: {
    id: number;
    name: string;
    email: string;
    department_id?: number | null;
    es_lider?: boolean;
    onboarding_pendiente?: boolean;
    can_manage_announcements?: boolean;
    roles?: Array<{
      id: number;
      name: string;
    }>;
  };
};

type Conversation = {
  id: number;
  name: string | null;
  type: string;
  users: Array<{
    id: number;
    name: string;
  }>;
  created_at: string;
  updated_at: string;
};

type BackendMessage = {
  id: number;
  content: string;
  type?: string;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  creator?: {
    id: number;
    name: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
};

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const deltaSeconds = Math.max(1, Math.floor((now - date) / 1000));

  if (deltaSeconds < 60) {
    return "hace unos segundos";
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `hace ${deltaMinutes} min`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `hace ${deltaHours} h`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `hace ${deltaDays} d`;
}

function getConversationTitle(conversation: Conversation, currentUserId?: number): string {
  if (conversation.name) {
    return conversation.name;
  }

  const others = conversation.users.filter((participant) => participant.id !== currentUserId);
  if (others.length > 0) {
    return others.map((participant) => participant.name).join(", ");
  }

  return `Conversacion ${conversation.id}`;
}

function greeting(now: Date, name?: string | null): string {
  const hour = now.getHours();
  const slot = hour < 12 ? "Buenos dias" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  return name ? `${slot}, ${name.split(" ")[0]}` : slot;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationPreviews, setConversationPreviews] = useState<Record<number, string>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let ignore = false;

    const loadCurrentUser = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiFetch<MeResponse>("/me", { method: "GET" });

        if (!ignore) {
          setUser(response.data);
        }
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiClientError && error.status === 401) {
            setErrorMessage("No autenticado. Inicia sesion nuevamente.");
            clearAccessToken();
          } else if (error instanceof ApiClientError) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage("No se pudo validar la sesion con el backend.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    const loadConversations = async () => {
      setIsLoadingChats(true);

      try {
        const conversationsResponse = await apiFetch<{ data: Conversation[] } | Conversation[]>(
          "/conversations",
          {
            method: "GET",
          },
        );

        if (ignore) {
          return;
        }

        const conversationsList = Array.isArray(conversationsResponse)
          ? conversationsResponse
          : conversationsResponse.data;

        setConversations(conversationsList);

        const previewTargets = conversationsList.slice(0, 6);
        const previews = await Promise.all(
          previewTargets.map(async (conversation) => {
            try {
              const response = await apiFetch<BackendMessage[] | { data: BackendMessage[] }>(
                `/conversations/${conversation.id}/messages`,
                {
                  method: "GET",
                },
              );

              const messages = Array.isArray(response) ? response : response.data;
              const latest = messages[messages.length - 1];

              if (!latest) {
                return [conversation.id, "Sin mensajes todavia"] as const;
              }

              const normalizedContent = latest.content?.trim();
              if (normalizedContent) {
                return [conversation.id, normalizedContent] as const;
              }

              return [
                conversation.id,
                latest.type === "file" ? "Archivo adjunto" : "Mensaje sin texto",
              ] as const;
            } catch {
              return [conversation.id, "Sin mensajes todavia"] as const;
            }
          }),
        );

        if (!ignore) {
          setConversationPreviews(Object.fromEntries(previews));
        }
      } catch {
        if (!ignore) {
          setConversations([]);
          setConversationPreviews({});
        }
      } finally {
        if (!ignore) {
          setIsLoadingChats(false);
        }
      }
    };

    const loadAnnouncements = async () => {
      setIsLoadingAnnouncements(true);

      try {
        const announcementsResponse = await apiFetch<Announcement[]>("/announcements", {
          method: "GET",
        });

        if (!ignore) {
          setAnnouncements(announcementsResponse);
        }
      } catch {
        if (!ignore) {
          setAnnouncements([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingAnnouncements(false);
        }
      }
    };

    void loadCurrentUser();
    void loadConversations();
    void loadAnnouncements();

    return () => {
      ignore = true;
    };
  }, []);

  const isAdmin = isAdministrator(user);
  const isUserLeader = isLeader(user);
  const isUserNewHire = isNewHire(user);
  const canManageAnnouncements = Boolean(user?.can_manage_announcements);

  const departmentFeed = useMemo(
    () =>
      announcements
        .slice()
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
        )
        .slice(0, 6)
        .map((announcement) => ({
          id: announcement.id,
          department: announcement.department?.name ?? "General",
          title: announcement.title,
          body: announcement.content,
          time: formatRelativeTime(announcement.created_at),
          author: announcement.creator?.name ?? "Usuario",
        })),
    [announcements],
  );

  const chatContacts = useMemo(
    () =>
      conversations
        .slice()
        .sort(
          (left, right) =>
            new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
        )
        .slice(0, 5)
        .map((conversation) => ({
          id: conversation.id,
          name: getConversationTitle(conversation, user?.id),
          status: formatRelativeTime(conversation.updated_at),
          lastMessage: conversationPreviews[conversation.id] ?? "Sin mensajes todavia",
        })),
    [conversations, conversationPreviews, user?.id],
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-[var(--background)]">
      <DashboardSidebar
        user={user ? { name: user.name, email: user.email } : null}
        isAdmin={isAdmin}
        isLeader={isUserLeader}
        isNewHire={isUserNewHire}
        canManageAnnouncements={canManageAnnouncements}
        activeRoute="dashboard"
        statusMessage={isLoading ? "Validando sesion..." : errorMessage ? errorMessage : "Sesion activa"}
      />

      <HelpButton tourId="dashboard" variant="floating" />

      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />

        <div className="min-w-0 flex-1 px-5 py-6 lg:px-8 xl:px-10">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
          <HeroCard
            isLoading={isLoading}
            errorMessage={errorMessage}
            greeting={greeting(new Date(), user?.name)}
          />

          <div data-tour-id="dashboard-stats">
          <StaggerGroup className="grid grid-cols-2 gap-4">
            <StaggerItem>
              <StatTile
                icon={Megaphone}
                label="Publicaciones"
                value={departmentFeed.length}
                tone="primary"
              />
            </StaggerItem>
            <StaggerItem>
              <StatTile
                icon={MessageSquare}
                label="Conversaciones"
                value={chatContacts.length}
                tone="accent"
              />
            </StaggerItem>
          </StaggerGroup>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-6">
              <Reveal>
                <FeedCard data-tour-id="dashboard-feed">
                  <FeedHeader
                    title="Publicaciones de tu equipo"
                    subtitle="Lo ultimo que compartieron tus departamentos."
                    action={
                      canManageAnnouncements ? (
                        <Link
                          href="/dashboard/publications"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Nueva publicacion
                        </Link>
                      ) : null
                    }
                  />

                  {isLoadingAnnouncements ? <FeedSkeleton /> : null}

                  {!isLoadingAnnouncements && departmentFeed.length === 0 ? (
                    <EmptyState
                      icon={Megaphone}
                      title="Aun no hay publicaciones"
                      body="Cuando tu equipo comparta novedades apareceran aqui."
                    />
                  ) : null}

                  <StaggerGroup className="space-y-3" stagger={0.06} inView={false}>
                    {departmentFeed.map((post) => (
                      <StaggerItem key={post.id}>
                        <PostRow post={post} />
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                </FeedCard>
              </Reveal>

              <Reveal delay={0.05}>
                <FeedCard>
                  <FeedHeader
                    title="Atajos"
                    subtitle="Accede rapidamente a las areas mas usadas."
                  />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <QuickAction href="/dashboard/documents" icon={FileText} label="Documentos" />
                    <QuickAction href="/dashboard/conversations" icon={MessageSquare} label="Mensajes" />
                    <QuickAction href="/dashboard/publications" icon={Megaphone} label="Anuncios" />
                  </div>
                </FeedCard>
              </Reveal>
            </div>

            <aside className="space-y-6">
              <Reveal delay={0.05}>
                <FeedCard data-tour-id="dashboard-chats">
                  <FeedHeader
                    title="Conversaciones"
                    subtitle="Mensajes recientes"
                    action={
                      <Link
                        href="/dashboard/conversations"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                      >
                        Ver todas
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    }
                  />

                  <div className="space-y-2.5">
                    {isLoadingChats ? <ChatSkeleton /> : null}

                    {!isLoadingChats && chatContacts.length === 0 ? (
                      <EmptyState
                        icon={MessageSquare}
                        title="Sin conversaciones"
                        body="Inicia una nueva conversacion desde la seccion de mensajes."
                      />
                    ) : null}

                    {chatContacts.map((contact) => (
                      <Link
                        key={contact.id}
                        href="/dashboard/conversations"
                        className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                            {contact.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                {contact.name}
                              </p>
                              <span className="shrink-0 text-[10px] text-[var(--muted)]">
                                {contact.status}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                              {contact.lastMessage}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <Link
                    href="/dashboard/conversations"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Abrir mensajes
                  </Link>
                </FeedCard>
              </Reveal>
            </aside>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type HeroCardProps = {
  isLoading: boolean;
  errorMessage: string | null;
  greeting: string;
};

function HeroCard({ isLoading, errorMessage, greeting }: HeroCardProps) {
  return (
    <Reveal>
      <div data-tour-id="dashboard-greeting" className="surface-card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[var(--primary-soft)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-12 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl"
        />

        <div className="relative grid gap-6 sm:grid-cols-[1.5fr_1fr] sm:items-end">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
              <Flame className="h-3 w-3" />
              Tu centro de operaciones
            </p>

            {isLoading ? (
              <Skeleton className="mt-4 h-8 w-72" rounded="md" />
            ) : (
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                {errorMessage ? "Hola de nuevo" : greeting}
              </h1>
            )}

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              Aqui encontraras tus publicaciones, mensajes pendientes y los
              ultimos movimientos de tu equipo.
            </p>

            {errorMessage ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-3 py-2 text-xs text-[color:var(--danger)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Link
              href="/dashboard/conversations"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_var(--primary-glow)] transition hover:bg-[var(--primary-hover)] active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              Abrir mensajes
            </Link>
            <Link
              href="/dashboard/publications"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
            >
              <Megaphone className="h-4 w-4" />
              Publicaciones
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

type StatTileProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "primary" | "accent" | "neutral" | "success";
  suffix?: string;
  text?: boolean;
};

function StatTile({ icon: Icon, label, value, tone = "primary", suffix, text }: StatTileProps) {
  const toneClass = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    neutral: "bg-[var(--surface-muted)] text-[var(--muted)]",
    success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
  }[tone];

  return (
    <div className="surface-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-[var(--muted-soft)]" />
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 font-semibold tracking-tight text-[var(--foreground)]",
            text ? "text-2xl" : "text-3xl",
          )}
        >
          {value}
        </p>
        {suffix ? (
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">{suffix}</p>
        ) : null}
      </div>
    </div>
  );
}

function FeedCard({ children, className, ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <section {...rest} className={cn("surface-card p-5 sm:p-6", className)}>{children}</section>;
}

function FeedHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

type PostRowProps = {
  post: {
    id: number;
    department: string;
    title: string;
    body: string;
    time: string;
    author: string;
  };
};

function PostRow({ post }: PostRowProps) {
  return (
    <article className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--primary)] uppercase">
          {post.department}
        </span>
        <span className="text-[10px] text-[var(--muted)]">{post.time}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-tight text-[var(--foreground)]">
        {post.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{post.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--muted)]">por {post.author}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Me gusta"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Responder"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[var(--border)] p-4">
          <Skeleton className="h-3 w-20" rounded="md" />
          <Skeleton className="mt-3 h-4 w-3/4" rounded="md" />
          <Skeleton className="mt-2 h-3 w-full" rounded="md" />
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
          <Skeleton className="h-9 w-9" rounded="full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-1/2" rounded="md" />
            <Skeleton className="mt-2 h-3 w-3/4" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 px-4 py-6 text-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{body}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}