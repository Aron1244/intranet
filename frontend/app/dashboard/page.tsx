"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Eye,
  FileText,
  Flame,
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import {
  DashboardSidebar,
  MobileNavDrawer,
  visibleNavItems,
} from "@/components/dashboard-sidebar";
import { HelpButton } from "@/components/help-button";
import { Skeleton } from "@/components/skeleton";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { isAdministrator, isLeader, isNewHire, ROLE_ADMIN_LEGACY_ALIASES } from "@/lib/roles";
import { cn } from "@/lib/cn";

type UserRole = {
  id: number;
  name: string;
  can_manage_department?: boolean;
};

type MeResponse = {
  data: {
    id: number;
    name: string;
    email: string;
    department_id?: number | null;
    es_lider?: boolean;
    onboarding_pendiente?: boolean;
    can_manage_announcements?: boolean;
    roles?: UserRole[];
  };
};

type Conversation = {
  id: number;
  name: string | null;
  type: string;
  unread_count?: number;
  updated_at: string;
  users: Array<{ id: number; name: string }>;
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
  creator?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
};

type Department = {
  id: number;
  name: string;
};

const HONORIFICS = new Set([
  "sr",
  "sra",
  "srta",
  "dr",
  "dra",
  "prof",
  "profa",
  "lic",
  "licda",
  "ing",
  "mg",
  "msc",
]);

/** "Prof. Tatum Bernier" -> "Tatum". Evita saludar por el titulo. */
function firstName(fullName?: string | null): string {
  const tokens = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  let start = 0;
  while (
    start < tokens.length - 1 &&
    HONORIFICS.has(tokens[start].toLowerCase().replace(/\./g, ""))
  ) {
    start += 1;
  }
  return tokens[start] ?? "";
}

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
  if (deltaDays < 7) {
    return `hace ${deltaDays} d`;
  }

  return new Date(isoDate).toLocaleDateString("es", { day: "numeric", month: "short" });
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
  const who = firstName(name);
  return who ? `${slot}, ${who}` : slot;
}

/** Quita el alias legacy "Admin" cuando ya existe el rol canonico "Administrador". */
function displayRoles(roles: UserRole[] | undefined): string[] {
  const names = (roles ?? []).map((role) => role.name);
  const hasCanonicalAdmin = names.includes("Administrador");
  return names.filter(
    (name) => !(hasCanonicalAdmin && ROLE_ADMIN_LEGACY_ALIASES.includes(name)),
  );
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationPreviews, setConversationPreviews] = useState<Record<number, string>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadCurrentUser = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiFetch<MeResponse>("/me", { method: "GET" });

        if (ignore) {
          return;
        }

        setUser(response.data);

        if (response.data.department_id) {
          const departments = await apiFetch<{ data: Department[] }>("/departments", {
            method: "GET",
          });
          const departmentsList = Array.isArray(departments) ? departments : departments.data;
          if (!ignore) {
            setDepartmentName(
              departmentsList.find((d) => d.id === response.data.department_id)?.name ?? null,
            );
          }
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          setErrorMessage("No autenticado. Inicia sesion nuevamente.");
          clearAccessToken();
        } else if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("No se pudo validar la sesion con el backend.");
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
          { method: "GET" },
        );

        if (ignore) {
          return;
        }

        const conversationsList = Array.isArray(conversationsResponse)
          ? conversationsResponse
          : conversationsResponse.data;

        setConversations(conversationsList);

        const previews = await Promise.all(
          conversationsList.slice(0, 6).map(async (conversation) => {
            try {
              const response = await apiFetch<BackendMessage[] | { data: BackendMessage[] }>(
                `/conversations/${conversation.id}/messages`,
                { method: "GET" },
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

  // Totales reales del backend, no el recorte que se muestra en las tarjetas.
  const announcementTotal = announcements.length;
  const conversationTotal = conversations.length;
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  const departmentFeed = useMemo(
    () =>
      announcements
        .slice()
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
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
        .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
        .slice(0, 5)
        .map((conversation) => ({
          id: conversation.id,
          name: getConversationTitle(conversation, user?.id),
          status: formatRelativeTime(conversation.updated_at),
          lastMessage: conversationPreviews[conversation.id] ?? "Sin mensajes todavia",
          unread: conversation.unread_count ?? 0,
        })),
    [conversations, conversationPreviews, user?.id],
  );

  const query = search.trim().toLowerCase();

  const visibleFeed = useMemo(
    () =>
      !query
        ? departmentFeed
        : departmentFeed.filter((post) =>
            [post.title, post.body, post.author, post.department].some((value) =>
              value.toLowerCase().includes(query),
            ),
          ),
    [departmentFeed, query],
  );

  const visibleChats = useMemo(
    () =>
      !query
        ? chatContacts
        : chatContacts.filter((contact) =>
            [contact.name, contact.lastMessage].some((value) =>
              value.toLowerCase().includes(query),
            ),
          ),
    [chatContacts, query],
  );

  const searchSummary = `${visibleFeed.length + visibleChats.length} resultado${
    visibleFeed.length + visibleChats.length === 1 ? "" : "s"
  }`;

  const accessibleModules = useMemo(
    () =>
      visibleNavItems({
        isAdmin,
        isLeader: isUserLeader,
        isNewHire: isUserNewHire,
        canManageAnnouncements,
      }).map((item) => item.label),
    [isAdmin, isUserLeader, isUserNewHire, canManageAnnouncements],
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
        statusMessage={
          isLoading ? "Validando sesion..." : errorMessage ? errorMessage : "Sesion activa"
        }
      />

      <HelpButton tourId="dashboard" variant="floating" />

      <MobileNavDrawer
        user={user ? { name: user.name, email: user.email } : null}
        isAdmin={isAdmin}
        isLeader={isUserLeader}
        isNewHire={isUserNewHire}
        canManageAnnouncements={canManageAnnouncements}
        activeRoute="dashboard"
        statusMessage={
          isLoading ? "Validando sesion..." : errorMessage ? errorMessage : "Sesion activa"
        }
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          searchValue={search}
          onSearchChange={setSearch}
          searchSummary={searchSummary}
        />

        <div className="min-w-0 flex-1 px-5 py-6 lg:px-8 xl:px-10">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
            <HeroCard
              isLoading={isLoading}
              errorMessage={errorMessage}
              greeting={greeting(new Date(), user?.name)}
            />

            <div data-tour-id="dashboard-stats" className="grid gap-4 sm:grid-cols-3">
              <StatTile
                href="/dashboard/publications"
                icon={Megaphone}
                label="Publicaciones"
                value={isLoadingAnnouncements ? null : announcementTotal}
                tone="primary"
                hint="visibles para tu rol"
              />
              <StatTile
                href="/dashboard/conversations"
                icon={MessageSquare}
                label="Conversaciones"
                value={isLoadingChats ? null : conversationTotal}
                tone="accent"
                hint={isLoadingChats ? "cargando" : "activas ahora"}
              />
              <StatTile
                href="/dashboard/conversations"
                icon={Send}
                label="Sin leer"
                value={isLoadingChats ? null : unreadTotal}
                tone={unreadTotal > 0 ? "warning" : "neutral"}
                hint={unreadTotal > 0 ? "mensajes esperandote" : "todo al dia"}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-6">
                <FeedCard data-tour-id="dashboard-feed">
                  <FeedHeader
                    title="Publicaciones de tu equipo"
                    subtitle={
                      query
                        ? `Filtrando por "${search.trim()}"`
                        : "Lo ultimo que compartieron tus departamentos."
                    }
                    action={
                      canManageAnnouncements ? (
                        <Link
                          href="/dashboard/publications"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
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

                  {!isLoadingAnnouncements &&
                  departmentFeed.length > 0 &&
                  visibleFeed.length === 0 ? (
                    <EmptyState
                      icon={Megaphone}
                      title="Sin coincidencias"
                      body={`Ninguna publicacion responde a "${search.trim()}".`}
                    />
                  ) : null}

                  <div className="space-y-3">
                    {visibleFeed.map((post) => (
                      <PostRow key={post.id} post={post} />
                    ))}
                  </div>

                  {announcementTotal > departmentFeed.length ? (
                    <p className="mt-4 text-center text-xs text-[var(--muted)]">
                      Mostrando {departmentFeed.length} de {announcementTotal} publicaciones
                    </p>
                  ) : null}
                </FeedCard>

                <FeedCard>
                  <FeedHeader
                    title="Atajos"
                    subtitle="Accede rapidamente a las areas mas usadas."
                  />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <QuickAction
                      href="/dashboard/documents"
                      icon={FileText}
                      label="Documentos"
                    />
                    <QuickAction
                      href="/dashboard/conversations"
                      icon={MessageSquare}
                      label="Mensajes"
                    />
                    <QuickAction
                      href="/dashboard/publications"
                      icon={Megaphone}
                      label="Anuncios"
                    />
                  </div>
                </FeedCard>
              </div>

              <aside className="space-y-6">
                <FeedCard data-tour-id="dashboard-chats">
                  <FeedHeader
                    title="Conversaciones"
                    subtitle={
                      unreadTotal > 0 ? `${unreadTotal} mensajes sin leer` : "Mensajes recientes"
                    }
                    action={
                      <Link
                        href="/dashboard/conversations"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
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

                    {!isLoadingChats && chatContacts.length > 0 && visibleChats.length === 0 ? (
                      <EmptyState
                        icon={MessageSquare}
                        title="Sin coincidencias"
                        body={`Ninguna conversacion responde a "${search.trim()}".`}
                      />
                    ) : null}

                    {visibleChats.map((contact) => (
                      <Link
                        key={contact.id}
                        href="/dashboard/conversations"
                        className={cn(
                          "group flex items-start gap-3 rounded-[var(--radius-md)] border bg-[var(--surface)] p-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
                          contact.unread > 0
                            ? "border-[var(--primary)]/35 bg-[var(--primary-soft)]/25"
                            : "border-[var(--border)]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            contact.unread > 0
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--primary-soft)] text-[var(--primary)]",
                          )}
                        >
                          {contact.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={cn(
                                "truncate text-sm text-[var(--foreground)]",
                                contact.unread > 0 ? "font-semibold" : "font-medium",
                              )}
                            >
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
                        {contact.unread > 0 ? (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold text-white">
                            {contact.unread}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href="/dashboard/conversations"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-2.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Abrir mensajes
                  </Link>
                </FeedCard>

                <ScopeCard
                  roles={displayRoles(user?.roles)}
                  department={departmentName}
                  isAdmin={isAdmin}
                  isLeader={isUserLeader}
                  isNewHire={isUserNewHire}
                  canManageAnnouncements={canManageAnnouncements}
                  modules={accessibleModules}
                  isLoading={isLoading}
                />
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
    <div
      data-tour-id="dashboard-greeting"
      className="surface-card relative overflow-hidden p-6 sm:p-8"
    >
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
            Aqui encontraras tus publicaciones, mensajes pendientes y los ultimos movimientos de
            tu equipo.
          </p>

          {errorMessage ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-3 py-2 text-xs text-[color:var(--danger)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Link
            href="/dashboard/conversations"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_var(--primary-glow)] transition hover:bg-[var(--primary-hover)] active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            Abrir mensajes
          </Link>
          <Link
            href="/dashboard/publications"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
          >
            <Megaphone className="h-4 w-4" />
            Publicaciones
          </Link>
        </div>
      </div>
    </div>
  );
}

type StatTileProps = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  tone?: "primary" | "accent" | "neutral" | "warning";
  hint?: string;
};

function StatTile({ href, icon: Icon, label, value, tone = "primary", hint }: StatTileProps) {
  const toneClass = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    neutral: "bg-[var(--surface-muted)] text-[var(--muted)]",
    warning: "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
  }[tone];

  return (
    <Link
      href={href}
      className="surface-card group flex items-center gap-4 p-4 transition hover:border-[var(--border-strong)]"
    >
      <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]", toneClass)}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </p>
        {value === null ? (
          <Skeleton className="mt-1 h-7 w-10" rounded="md" />
        ) : (
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
        )}
        {hint ? <p className="text-[11px] text-[var(--muted)]">{hint}</p> : null}
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--muted-soft)] transition group-hover:text-[var(--primary)]" />
    </Link>
  );
}

/**
 * Resumen de alcance: que roles tiene el usuario y que modulos puede ver.
 * Es el complemento del feed: deja claro por que aparece (o no) cada seccion.
 */
function ScopeCard({
  roles,
  department,
  isAdmin,
  isLeader,
  isNewHire,
  canManageAnnouncements,
  modules,
  isLoading,
}: {
  roles: string[];
  department: string | null;
  isAdmin: boolean;
  isLeader: boolean;
  isNewHire: boolean;
  canManageAnnouncements: boolean;
  modules: string[];
  isLoading: boolean;
}) {
  const badges: string[] = [];

  if (isAdmin) badges.push("Acceso total");
  if (isLeader) badges.push("Gestion de equipo");
  if (canManageAnnouncements) badges.push("Publica contenido");
  if (isNewHire) badges.push("Onboarding pendiente");

  return (
    <FeedCard>
      <FeedHeader title="Tu alcance" subtitle="Lo que puedes ver con tu perfil." />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" rounded="md" />
          <Skeleton className="h-4 w-2/3" rounded="md" />
          <Skeleton className="h-4 w-1/3" rounded="md" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              Rol
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--muted)]">Sin rol asignado</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              Departamento
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              {department ?? "Sin departamento asignado"}
            </p>
          </div>

          {badges.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                Permisos
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {badges.map((badge) => (
                  <li key={badge} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                    {badge}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              Modulos visibles
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {modules.map((module) => (
                <span
                  key={module}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--muted)]"
                >
                  <Eye className="h-3 w-3" />
                  {module}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </FeedCard>
  );
}

function FeedCard({
  children,
  className,
  ...rest
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section {...rest} className={cn("surface-card p-5 sm:p-6", className)}>
      {children}
    </section>
  );
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
      <div className="min-w-0">
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
    <article className="group rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]">
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
            aria-label={`Me gusta: ${post.title}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Responder: ${post.title}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
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
        <div key={index} className="rounded-[var(--radius-md)] border border-[var(--border)] p-4">
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
        <div
          key={index}
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3"
        >
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
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 px-4 py-6 text-center">
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
      className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}