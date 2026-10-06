"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Eye,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { HelpButton } from "@/components/help-button";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { isAdministrator } from "@/lib/roles";
import { cn } from "@/lib/cn";

type MeResponse = {
  data: {
    id: number;
    name: string;
    email: string;
    roles?: Array<{ id: number; name: string }>;
  };
};

type TrashMessage = {
  id: number;
  type: "message";
  conversation_id: number;
  conversation_name: string | null;
  department_id: number | null;
  content: string;
  sender: { id: number; name: string } | null;
  deleted_by: { id: number; name: string } | null;
  deleted_at: string;
  created_at: string;
};

type TrashDocument = {
  id: number;
  type: "document";
  title: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  owner: { id: number; name: string } | null;
  folder: { id: number; name: string; department_id: number } | null;
  department_id: number | null;
  deleted_by: { id: number; name: string } | null;
  deleted_at: string;
  created_at: string;
};

type TrashPayload = {
  messages: TrashMessage[];
  documents: TrashDocument[];
};

type Filter = "all" | "messages" | "documents";

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return iso;
  }
}

export default function TrashPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<TrashPayload>({ messages: [], documents: [] });
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiFetch<{ data: TrashPayload }>("/trash", { method: "GET" });
      setItems(response.data);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("Solo los administradores pueden revisar la papelera.");
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No se pudo cargar la papelera.");
      }
      setItems({ messages: [], documents: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      try {
        const meResponse = await apiFetch<MeResponse>("/me", { method: "GET" });
        if (ignore) {
          return;
        }
        setUser(meResponse.data);
        const allowed = isAdministrator(meResponse.data);
        setIsAdmin(allowed);
        if (!allowed) {
          setErrorMessage("Solo los administradores pueden acceder a la papelera.");
          clearAccessToken();
        }
      } catch (error) {
        if (!ignore && error instanceof ApiClientError && error.status === 401) {
          clearAccessToken();
        }
      }
    };

    queueMicrotask(() => {
      void bootstrap();
      void loadTrash();
    });

    return () => {
      ignore = true;
    };
  }, [loadTrash]);

  const handleRestore = useCallback(
    async (type: "message" | "document", id: number) => {
      const busyKey = `${type}-${id}-restore`;
      setBusyId(busyKey);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        await apiFetch(`/trash/${type === "message" ? "messages" : "documents"}/${id}/restore`, {
          method: "POST",
        });
        setSuccessMessage(type === "message" ? "Mensaje restaurado." : "Documento restaurado.");
        await loadTrash();
      } catch (error) {
        setErrorMessage(
          error instanceof ApiClientError ? error.message : "No se pudo restaurar.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [loadTrash],
  );

  const handleDestroy = useCallback(
    async (type: "message" | "document", id: number, label: string) => {
      const confirmed = window.confirm(`Eliminar definitivamente "${label}"? Esta accion no se puede deshacer.`);
      if (!confirmed) {
        return;
      }
      const busyKey = `${type}-${id}-destroy`;
      setBusyId(busyKey);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        await apiFetch(`/trash/${type === "message" ? "messages" : "documents"}/${id}`, {
          method: "DELETE",
        });
        setSuccessMessage(type === "message" ? "Mensaje eliminado definitivamente." : "Documento eliminado definitivamente.");
        await loadTrash();
      } catch (error) {
        setErrorMessage(
          error instanceof ApiClientError ? error.message : "No se pudo eliminar.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [loadTrash],
  );

  const filteredMessages = useMemo(
    () => (filter === "documents" ? [] : items.messages),
    [filter, items.messages],
  );
  const filteredDocuments = useMemo(
    () => (filter === "messages" ? [] : items.documents),
    [filter, items.documents],
  );

  const totalCount = items.messages.length + items.documents.length;

  return (
    <div className="flex min-h-[100dvh] w-full bg-[var(--background)]">
      <DashboardSidebar
        user={user ? { name: user.name, email: user.email } : null}
        isAdmin={isAdmin}
        isLeader={false}
        isNewHire={false}
        canManageAnnouncements={false}
        activeRoute="trash"
        statusMessage={
          isLoading
            ? "Cargando papelera..."
            : errorMessage
              ? errorMessage
              : `${totalCount} ${totalCount === 1 ? "elemento" : "elementos"} marcados`
        }
      />

      <HelpButton tourId="trash" variant="floating" />

      <section className="min-w-0 flex-1 px-5 py-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al resumen
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                  <ShieldAlert className="h-3 w-3" />
                  Papelera
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  Revision de elementos marcados
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  Los lideres de departamento pueden marcar mensajes y documentos para revision.
                  Tu decides si restaurar o eliminarlos definitivamente.
                </p>
              </div>
            </div>
          </header>

          {errorMessage ? (
            <div className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 px-4 py-3 text-sm text-[color:var(--success)]">
              {successMessage}
            </div>
          ) : null}

          <div data-tour-id="trash-filters" className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
              <Filter className="h-3 w-3" />
              Filtrar
            </span>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Todo ({totalCount})
            </FilterChip>
            <FilterChip active={filter === "messages"} onClick={() => setFilter("messages")}>
              Mensajes ({items.messages.length})
            </FilterChip>
            <FilterChip active={filter === "documents"} onClick={() => setFilter("documents")}>
              Documentos ({items.documents.length})
            </FilterChip>
          </div>

          {isLoading ? (
            <TrashSkeleton />
          ) : totalCount === 0 ? (
            <EmptyTrash />
          ) : (
            <div data-tour-id="trash-list" className="space-y-6">
              {filteredMessages.length > 0 ? (
                <section className="space-y-3">
                  <header className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                    <MessageSquare className="h-4 w-4 text-[var(--muted)]" />
                    Mensajes ({filteredMessages.length})
                  </header>
                  <div className="space-y-3">
                    {filteredMessages.map((message) => (
                      <TrashItem
                        key={`message-${message.id}`}
                        icon={<MessageSquare className="h-4 w-4" />}
                        title={message.content || "(mensaje vacio)"}
                        subtitle={
                          <span>
                            Por <strong>{message.sender?.name ?? "Desconocido"}</strong>
                            {message.conversation_name
                              ? ` en ${message.conversation_name}`
                              : ""}
                          </span>
                        }
                        meta={`Marcado el ${formatDateTime(message.deleted_at)} por ${message.deleted_by?.name ?? "alguien"}`}
                        busy={busyId === `message-${message.id}-restore` || busyId === `message-${message.id}-destroy`}
                        onRestore={() => void handleRestore("message", message.id)}
                        onDestroy={() =>
                          void handleDestroy(
                            "message",
                            message.id,
                            message.content.slice(0, 60) || "este mensaje",
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {filteredDocuments.length > 0 ? (
                <section className="space-y-3">
                  <header className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                    <FileText className="h-4 w-4 text-[var(--muted)]" />
                    Documentos ({filteredDocuments.length})
                  </header>
                  <div className="space-y-3">
                    {filteredDocuments.map((document) => (
                      <TrashItem
                        key={`document-${document.id}`}
                        icon={<FileText className="h-4 w-4" />}
                        title={document.title}
                        subtitle={
                          <span>
                            Subido por <strong>{document.owner?.name ?? "Desconocido"}</strong>
                            {document.folder ? ` en ${document.folder.name}` : " (general)"}
                          </span>
                        }
                        meta={`${document.original_name ?? "archivo"} · ${formatBytes(document.size_bytes)} · Marcado el ${formatDateTime(document.deleted_at)} por ${document.deleted_by?.name ?? "alguien"}`}
                        busy={busyId === `document-${document.id}-restore` || busyId === `document-${document.id}-destroy`}
                        onRestore={() => void handleRestore("document", document.id)}
                        onDestroy={() =>
                          void handleDestroy(
                            "document",
                            document.id,
                            document.title,
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition",
        active
          ? "bg-[var(--primary)] text-white"
          : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
      )}
    >
      {children}
    </button>
  );
}

function TrashItem({
  icon,
  title,
  subtitle,
  meta,
  busy,
  onRestore,
  onDestroy,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  meta: string;
  busy: boolean;
  onRestore: () => void;
  onDestroy: () => void;
}) {
  return (
    <article className="surface-card flex flex-wrap items-start gap-4 p-4">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--muted)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
        <p className="mt-1 text-[11px] text-[var(--muted-soft)]">{meta}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar
        </button>
        <button
          type="button"
          onClick={onDestroy}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-1.5 text-xs font-semibold text-[color:var(--danger)] transition hover:bg-[color:var(--danger)]/20 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Eliminar definitivamente
        </button>
      </div>
    </article>
  );
}

function TrashSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="surface-card p-4">
          <div className="skeleton-shimmer h-4 w-2/3 rounded-md" />
          <div className="skeleton-shimmer mt-3 h-3 w-1/2 rounded-md" />
          <div className="skeleton-shimmer mt-3 h-3 w-1/3 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyTrash() {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
        <Archive className="h-5 w-5" />
      </span>
      <p className="text-base font-semibold text-[var(--foreground)]">
        La papelera esta vacia
      </p>
      <p className="max-w-md text-sm text-[var(--muted)]">
        No hay elementos marcados para revision. Los lideres de departamento pueden enviarte contenido para decidir aqui.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        <Eye className="h-3.5 w-3.5" />
        Volver al resumen
      </Link>
    </div>
  );
}