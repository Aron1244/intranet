"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Flag,
  Folder,
} from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { HelpButton } from "@/components/help-button";
import { API_BASE, ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken, getAccessToken } from "@/lib/auth-token";
import { isAdministrator, isDepartmentLeader, isLeader, isNewHire } from "@/lib/roles";
import { cn } from "@/lib/cn";

type DocumentsViewMode = "all" | "chat" | "department" | "other";

type DocumentGroupTone = "primary" | "accent" | "neutral";

/*
 * `GET /documents` devuelve la colección completa sin paginar
 * (DocumentController::index hace ->get()). Con cientos de adjuntos eso pintaba
 * todas las tarjetas en el DOM de una vez. Aquí se pagina en cliente, igual que
 * en /dashboard/users: el buscador y los filtros de origen ya operaban sobre el
 * conjunto completo, así que solo hay que recortar la vista.
 */
const DOCUMENTS_PER_PAGE = 12;

const GROUP_TONE_CLASSES: Record<DocumentGroupTone, { wrap: string; title: string; badge: string }> = {
  primary: {
    wrap: "border-[var(--primary)]/20 bg-[var(--primary-soft)]/45",
    title: "text-[var(--primary)]",
    badge: "bg-[var(--surface)] text-[var(--primary)]",
  },
  accent: {
    wrap: "border-[color:var(--accent)]/25 bg-[var(--accent-soft)]/45",
    title: "text-[var(--accent)]",
    badge: "bg-[var(--surface)] text-[var(--accent)]",
  },
  neutral: {
    wrap: "border-[var(--border)] bg-[var(--surface-muted)]/60",
    title: "text-[var(--foreground)]",
    badge: "bg-[var(--surface)] text-[var(--muted)]",
  },
};

/**
 * Agrupa documentos por origen (chat / departamento / otros). Antes estos tres
 * bloques estaban duplicados literal en el JSX, cada uno con sus colores
 * hardcodeados; ahora comparten el mismo marcado y tono.
 */
function DocumentGroup({
  title,
  count,
  tone,
  groups,
  renderCard,
}: {
  title: string;
  count: number;
  tone: DocumentGroupTone;
  groups: Array<[string, DocumentItem[]]>;
  renderCard: (document: DocumentItem) => React.ReactNode;
}) {
  const toneClasses = GROUP_TONE_CLASSES[tone];

  return (
    <section className={cn("space-y-3 rounded-[var(--radius-lg)] border p-3", toneClasses.wrap)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className={cn("text-sm font-semibold", toneClasses.title)}>{title}</h4>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
            toneClasses.badge,
          )}
        >
          {count}
        </span>
      </div>

      {groups.map(([groupLabel, groupDocuments]) => (
        <div key={groupLabel} className="space-y-2">
          {groupLabel ? (
            <p className="px-0.5 text-xs font-semibold text-[var(--muted)]">{groupLabel}</p>
          ) : null}
          <div className="space-y-2">{groupDocuments.map(renderCard)}</div>
        </div>
      ))}
    </section>
  );
}

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

type DocumentItem = {
  id: number;
  title: string;
  file_path: string;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  visibility: "private" | "public" | "department";
  created_at?: string;
  user?: {
    id: number;
    name: string;
  };
  folder?: {
    id: number;
    name: string;
    department_id: number;
  };
  origin?: {
    type: "chat" | "folder" | "general";
    label: string;
    conversation_id?: number;
    folder_id?: number;
  };
};

type DocumentsResponse = {
  data: DocumentItem[];
};

function formatFileSize(sizeInBytes?: number | null): string {
  if (!sizeInBytes || sizeInBytes <= 0) {
    return "";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKb = sizeInBytes / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

function getVisibilityLabel(visibility: DocumentItem["visibility"]): string {
  if (visibility === "public") {
    return "Público";
  }

  if (visibility === "department") {
    return "Departamento";
  }

  return "Privado";
}

function getOriginLabel(document: DocumentItem): string {
  if (document.origin?.label) {
    return document.origin.label;
  }

  if (document.folder?.name) {
    return `Carpeta: ${document.folder.name}`;
  }

  return "General";
}

export default function DocumentsPage() {
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isDownloadingDocumentId, setIsDownloadingDocumentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<DocumentsViewMode>("all");
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Cambiar buscador o filtro acorta la lista: se vuelve a la página 1 desde el
  // handler en vez de un efecto, para no desincronizar un setState en un efecto.
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode: DocumentsViewMode) => {
    setViewMode(mode);
    setPage(1);
  }, []);

  const setHandledError = useCallback((error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiClientError) {
      if (error.status === 401) {
        setErrorMessage("No autenticado. Inicia sesión nuevamente.");
        setIsPermissionError(false);
        clearAccessToken();
        return;
      }

      if (error.status === 403) {
        setErrorMessage("No tienes permisos para realizar esta acción.");
        setIsPermissionError(true);
        return;
      }

      setErrorMessage(error.message);
      setIsPermissionError(false);
      return;
    }

    setErrorMessage(fallbackMessage);
    setIsPermissionError(false);
  }, []);

  const loadPageData = useCallback(async () => {
    setIsLoadingUser(true);
    setIsLoadingDocuments(true);
    setErrorMessage(null);
    setIsPermissionError(false);

    try {
      const [meResponse, documentsResponse] = await Promise.all([
        apiFetch<MeResponse>("/me", { method: "GET" }),
        apiFetch<DocumentsResponse>("/documents", { method: "GET" }),
      ]);

      setUser(meResponse.data);
      setDocuments(documentsResponse.data);
    } catch (error) {
      setHandledError(error, "No se pudo cargar la sección de documentos.");
    } finally {
      setIsLoadingUser(false);
      setIsLoadingDocuments(false);
    }
  }, [setHandledError]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPageData();
    });
  }, [loadPageData]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const isAdmin = isAdministrator(user);
  const isUserLeader = isLeader(user);
  const isUserNewHire = isNewHire(user);
  const canModerateDocuments = isAdmin || isDepartmentLeader(user);
  const canManageAnnouncements = Boolean(user?.can_manage_announcements);

  const sortedDocuments = useMemo(
    () =>
      documents.slice().sort((left, right) => {
        const rightTime = new Date(right.created_at ?? 0).getTime();
        const leftTime = new Date(left.created_at ?? 0).getTime();
        return rightTime - leftTime;
      }),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedDocuments;
    }

    return sortedDocuments.filter((document) => {
      const searchableFields = [
        document.original_name,
        document.title,
        document.mime_type,
        getOriginLabel(document),
        document.folder?.name,
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());

      return searchableFields.some((field) => field.includes(normalizedSearch));
    });
  }, [searchTerm, sortedDocuments]);

  const getDocumentCategory = useCallback((document: DocumentItem): Exclude<DocumentsViewMode, "all"> => {
    if (document.origin?.type === "chat") {
      return "chat";
    }

    if (document.visibility === "department" || document.origin?.type === "folder" || document.folder?.department_id) {
      return "department";
    }

    return "other";
  }, []);

  const visibleDocuments = useMemo(() => {
    if (viewMode === "all") {
      return filteredDocuments;
    }

    return filteredDocuments.filter((document) => getDocumentCategory(document) === viewMode);
  }, [filteredDocuments, getDocumentCategory, viewMode]);

  const totalPages = Math.max(1, Math.ceil(visibleDocuments.length / DOCUMENTS_PER_PAGE));
  // `page` puede quedar fuera de rango si la lista se acorta (borrado, filtro),
  // así que la vista se recorta contra un número ya acotado en lugar de
  // obligar a un efecto que lo corrija.
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pagedDocuments = useMemo(
    () =>
      visibleDocuments.slice(
        (currentPage - 1) * DOCUMENTS_PER_PAGE,
        currentPage * DOCUMENTS_PER_PAGE,
      ),
    [currentPage, visibleDocuments],
  );
  const firstShown = visibleDocuments.length === 0 ? 0 : (currentPage - 1) * DOCUMENTS_PER_PAGE + 1;
  const lastShown = Math.min(currentPage * DOCUMENTS_PER_PAGE, visibleDocuments.length);

  // Al cambiar de página el listado se reconstruye entero arriba; sin esto se
  // hereda el scroll anterior y la página nueva aparece a media altura.
  useEffect(() => {
    listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const documentsByChat = useMemo(() => {
    const grouped = new Map<string, DocumentItem[]>();

    for (const document of pagedDocuments) {
      if (getDocumentCategory(document) !== "chat") {
        continue;
      }

      const key = getOriginLabel(document);
      grouped.set(key, [...(grouped.get(key) ?? []), document]);
    }

    return Array.from(grouped.entries());
  }, [getDocumentCategory, pagedDocuments]);

  const documentsByDepartment = useMemo(() => {
    const grouped = new Map<string, DocumentItem[]>();

    for (const document of pagedDocuments) {
      if (getDocumentCategory(document) !== "department") {
        continue;
      }

      const key = document.folder?.name ? `Carpeta: ${document.folder.name}` : getOriginLabel(document);
      grouped.set(key, [...(grouped.get(key) ?? []), document]);
    }

    return Array.from(grouped.entries());
  }, [getDocumentCategory, pagedDocuments]);

  const otherDocuments = useMemo(
    () => pagedDocuments.filter((document) => getDocumentCategory(document) === "other"),
    [getDocumentCategory, pagedDocuments],
  );

  // Los grupos se arman sobre la página actual, así que su contador debe
  // contar lo que realmente se pinta debajo del encabezado.
  const pagedCountsByCategory = useMemo(() => {
    const counts: Record<Exclude<DocumentsViewMode, "all">, number> = {
      chat: 0,
      department: 0,
      other: 0,
    };

    for (const document of pagedDocuments) {
      counts[getDocumentCategory(document)] += 1;
    }

    return counts;
  }, [getDocumentCategory, pagedDocuments]);

  const countsByCategory = useMemo(() => {
    const counts: Record<Exclude<DocumentsViewMode, "all">, number> = {
      chat: 0,
      department: 0,
      other: 0,
    };

    for (const document of filteredDocuments) {
      counts[getDocumentCategory(document)] += 1;
    }

    return counts;
  }, [filteredDocuments, getDocumentCategory]);

  const handleDownloadDocument = useCallback(async (document: DocumentItem) => {
    const token = getAccessToken();

    if (!token) {
      setErrorMessage("Sesión expirada. Inicia sesión nuevamente.");
      setIsPermissionError(false);
      return;
    }

    setErrorMessage(null);
    setIsPermissionError(false);
    setIsDownloadingDocumentId(document.id);

    try {
      const response = await fetch(`${API_BASE}/documents/${document.id}/download`, {
        method: "GET",
        headers: {
          Accept: "application/octet-stream",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = window.document.createElement("a");

      downloadLink.href = blobUrl;
      downloadLink.download = document.original_name ?? document.title;
      window.document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(blobUrl);
      setSuccessMessage("Documento descargado correctamente.");
    } catch {
      setErrorMessage("No se pudo descargar el documento.");
      setIsPermissionError(false);
    } finally {
      setIsDownloadingDocumentId(null);
    }
  }, []);

  const handleSoftDeleteDocument = useCallback(async (document: DocumentItem) => {
    if (!canModerateDocuments) {
      return;
    }

    const confirmed = window.confirm(
      "Marcar este documento para revisión? Un administrador decidirá si eliminarlo definitivamente desde la Papelera.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/documents/${document.id}`, {
        method: "DELETE",
      });
      setSuccessMessage("Documento marcado para revisión.");
      await loadPageData();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para marcar este documento.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No se pudo marcar el documento.");
      }
    }
  }, [canModerateDocuments, loadPageData]);

  const renderDocumentCard = (document: DocumentItem) => (
    <article
      key={document.id}
      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 transition hover:border-[var(--border-strong)]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {document.original_name ?? document.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs text-[var(--muted)]">
            {document.mime_type ?? "Archivo"}
            {formatFileSize(document.size_bytes) ? ` • ${formatFileSize(document.size_bytes)}` : ""}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              document.visibility === "public"
                ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                : document.visibility === "department"
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "bg-[var(--surface-muted)] text-[var(--muted)]",
            )}
          >
            {getVisibilityLabel(document.visibility)}
          </span>
          {document.folder?.name ? (
            <span className="inline-flex items-center gap-1 truncate text-[11px] text-[var(--muted)]">
              <Folder className="h-3 w-3 shrink-0" />
              {document.folder.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void handleDownloadDocument(document)}
          disabled={isDownloadingDocumentId === document.id}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3.5 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          {isDownloadingDocumentId === document.id ? "Descargando..." : "Descargar"}
        </button>
        {canModerateDocuments ? (
          <button
            type="button"
            onClick={() => void handleSoftDeleteDocument(document)}
            title="Marcar para revisión del administrador"
            aria-label={`Marcar ${document.original_name ?? document.title} para revisión`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted-soft)] transition hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="flex min-h-screen w-full">
        <DashboardSidebar
          user={user ? { name: user.name, email: user.email } : null}
          isAdmin={isAdmin}
          isLeader={isUserLeader}
          isNewHire={isUserNewHire}
          canManageAnnouncements={canManageAnnouncements}
          activeRoute="documents"
          statusMessage={isLoadingUser || isLoadingDocuments ? "Cargando documentos..." : errorMessage ? errorMessage : "Documentos sincronizados"}
        />

        <HelpButton tourId="documents" variant="floating" />

        <section className="min-w-0 flex flex-1 flex-col px-4 py-6 lg:px-6 xl:px-8 2xl:px-10">
          <div className="mx-auto flex min-h-0 w-full max-w-360 flex-1 flex-col space-y-6">

            {errorMessage ? (
              <div className={`rounded-[var(--radius-md)] px-4 py-3 text-sm shadow-sm ${isPermissionError ? "border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)]" : "border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 text-[color:var(--danger)]"}`}>
                <p>{errorMessage}</p>
              </div>
            ) : null}

            {successMessage ? (
              <div className="pointer-events-none fixed top-4 right-4 z-50 rounded-[var(--radius-md)] border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 px-4 py-3 text-sm font-medium text-[color:var(--success)] shadow-[var(--shadow-lg)] backdrop-blur-sm">
                {successMessage}
              </div>
            ) : null}

            <section className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Archivos</h3>
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                  {visibleDocuments.length}
                </span>
              </div>

              <div data-tour-id="documents-search" className="mt-4">
                <label htmlFor="documents-search-input" className="sr-only">
                  Buscar documentos
                </label>
                <input
                  id="documents-search-input"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Buscar por nombre, tipo u origen..."
                  className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                />
              </div>

              <div data-tour-id="documents-filters" className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: "all" as const, label: "Todos", count: filteredDocuments.length },
                  { key: "chat" as const, label: "Chat", count: countsByCategory.chat },
                  {
                    key: "department" as const,
                    label: "Departamento",
                    count: countsByCategory.department,
                  },
                  { key: "other" as const, label: "Otros", count: countsByCategory.other },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => handleViewModeChange(filter.key)}
                    aria-pressed={viewMode === filter.key}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition",
                      viewMode === filter.key
                        ? "bg-[var(--primary)] text-white"
                        : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {filter.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[11px]",
                        viewMode === filter.key ? "bg-white/20" : "bg-[var(--surface-muted)]",
                      )}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              <div
                data-tour-id="documents-list"
                ref={listContainerRef}
                className="mt-4 min-h-0 flex-1 space-y-4 overflow-auto pr-1"
              >
                {isLoadingDocuments ? (
                  <p className="text-sm text-[var(--muted)]">Cargando documentos...</p>
                ) : null}

                {!isLoadingDocuments && sortedDocuments.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No hay documentos disponibles.</p>
                ) : null}

                {!isLoadingDocuments && sortedDocuments.length > 0 && visibleDocuments.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No se encontraron archivos con esa busqueda.
                  </p>
                ) : null}

                {documentsByChat.length > 0 ? (
                  <DocumentGroup
                    title="Archivos de chat"
                    count={pagedCountsByCategory.chat}
                    tone="primary"
                    groups={documentsByChat}
                    renderCard={renderDocumentCard}
                  />
                ) : null}

                {documentsByDepartment.length > 0 ? (
                  <DocumentGroup
                    title="Archivos de departamento"
                    count={pagedCountsByCategory.department}
                    tone="accent"
                    groups={documentsByDepartment}
                    renderCard={renderDocumentCard}
                  />
                ) : null}

                {otherDocuments.length > 0 ? (
                  <DocumentGroup
                    title="Otros archivos"
                    count={pagedCountsByCategory.other}
                    tone="neutral"
                    groups={[["", otherDocuments]]}
                    renderCard={renderDocumentCard}
                  />
                ) : null}
              </div>

              {totalPages > 1 ? (
                <nav
                  aria-label="Paginación de documentos"
                  className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3"
                >
                  <p className="text-xs text-[var(--muted)]">
                    Mostrando {firstShown}-{lastShown} de {visibleDocuments.length}
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(1)}
                      disabled={currentPage === 1}
                      aria-label="Ir a la primera página"
                      title="Primera página"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={currentPage === 1}
                      aria-label="Página anterior"
                      title="Página anterior"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="px-2 text-xs font-semibold text-[var(--muted)]">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Página siguiente"
                      title="Página siguiente"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage === totalPages}
                      aria-label="Ir a la última página"
                      title="Última página"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              ) : null}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
