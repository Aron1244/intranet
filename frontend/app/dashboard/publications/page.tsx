"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, X } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DepartmentSelect } from "@/components/department-select";
import type { DepartmentSelectOption } from "@/components/department-select";
import { HelpButton } from "@/components/help-button";
import { API_BASE, ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken, getAccessToken } from "@/lib/auth-token";
import { resolveDepartmentColor } from "@/lib/department-color";
import { isAdministrator, isCollaborator, isLeader, isNewHire } from "@/lib/roles";
import { cn } from "@/lib/cn";

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

type Announcement = {
  id: number;
  title: string;
  content: string;
  is_visible: boolean;
  department_id?: number | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
  attachments?: AnnouncementAttachment[];
};

type AnnouncementAttachment = {
  id: number;
  announcement_id: number;
  file_path: string;
  file_url?: string;
  original_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  is_image?: boolean;
};

type AnnouncementFormState = {
  title: string;
  content: string;
  is_visible: boolean;
  publish_all: boolean;
  department_id: string;
};

const INITIAL_FORM_STATE: AnnouncementFormState = {
  title: "",
  content: "",
  is_visible: false,
  publish_all: false,
  department_id: "",
};

type DepartmentOption = {
  id: number;
  name: string;
  color?: string | null;
};

type DepartmentsResponse = {
  data: DepartmentOption[];
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

function makePreviewText(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 220)}...`;
}

export default function PublicationsPage() {
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [isUpdatingVisibilityId, setIsUpdatingVisibilityId] = useState<number | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // El formulario ocupa media pantalla y empujaba el listado por debajo del
  // pliegue. Vive en un modal que solo se abre al publicar o al editar.
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [canAccessPublications, setCanAccessPublications] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [formState, setFormState] = useState<AnnouncementFormState>(INITIAL_FORM_STATE);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [removeAttachmentIds, setRemoveAttachmentIds] = useState<number[]>([]);

  const backendOrigin = useMemo(() => API_BASE.replace(/\/+api$/, ""), []);

  // Opciones del desplegable de departamento del formulario de publicacion.
  // El color viaja con la opcion para que se vea al desplegar la lista.
  const departmentSelectOptions = useMemo<DepartmentSelectOption[]>(
    () =>
      departments.map((department) => ({
        value: String(department.id),
        label: department.name,
        color: resolveDepartmentColor(department),
      })),
    [departments],
  );

  const newAttachmentPreviews = useMemo(
    () =>
      newAttachments.map((file) => ({
        file,
        objectUrl: URL.createObjectURL(file),
        isImage: file.type.startsWith("image/"),
      })),
    [newAttachments],
  );

  useEffect(
    () => () => {
      for (const preview of newAttachmentPreviews) {
        URL.revokeObjectURL(preview.objectUrl);
      }
    },
    [newAttachmentPreviews],
  );

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

  const loadAnnouncements = useCallback(async () => {
    const announcementsResponse = await apiFetch<Announcement[]>("/announcements", { method: "GET" });
    setAnnouncements(announcementsResponse);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadPageData = async () => {
      setIsLoadingUser(true);
      setIsLoadingAnnouncements(true);
      setErrorMessage(null);
      setIsPermissionError(false);

      try {
        const meResponse = await apiFetch<MeResponse>("/me", { method: "GET" });

        if (ignore) {
          return;
        }

        const allowed = Boolean(meResponse.data.can_manage_announcements);
        setUser(meResponse.data);
        setCanAccessPublications(allowed);

        if (meResponse.data.department_id) {
          setFormState((current) => ({
            ...current,
            department_id: String(meResponse.data.department_id),
          }));
        }

        const departmentsResponse = await apiFetch<DepartmentsResponse>("/departments", { method: "GET" });
        if (!ignore) {
          setDepartments(departmentsResponse.data);
        }

        if (!allowed) {
          setAnnouncements([]);
          setErrorMessage("No tienes permisos para acceder a Publicaciones.");
          setIsPermissionError(true);
          return;
        }

        await loadAnnouncements();
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiClientError && error.status === 401) {
            setErrorMessage("No autenticado. Inicia sesion nuevamente.");
            setIsPermissionError(false);
            clearAccessToken();
          } else if (error instanceof ApiClientError && error.status === 403) {
            setErrorMessage("No tienes permisos para ver publicaciones.");
            setIsPermissionError(true);
          } else if (error instanceof ApiClientError) {
            setErrorMessage(error.message);
            setIsPermissionError(false);
          } else {
            setErrorMessage("No se pudo cargar la seccion de publicaciones.");
            setIsPermissionError(false);
          }
        }
      } finally {
        if (!ignore) {
          setIsLoadingUser(false);
          setIsLoadingAnnouncements(false);
        }
      }
    };

    void loadPageData();

    return () => {
      ignore = true;
    };
  }, [loadAnnouncements]);

  const isAdmin = isAdministrator(user);
  const isUserLeader = isLeader(user);
  const isUserNewHire = isNewHire(user);
  const isUserCollaborator = isCollaborator(user);
  const canManageAnnouncements = Boolean(user?.can_manage_announcements);

  const sortedAnnouncements = useMemo(
    () =>
      announcements.slice().sort((left, right) => {
        const rightTime = new Date(right.created_at).getTime();
        const leftTime = new Date(left.created_at).getTime();
        return rightTime - leftTime;
      }),
    [announcements],
  );

  const editingAnnouncement = useMemo(
    () => announcements.find((item) => item.id === editingAnnouncementId) ?? null,
    [announcements, editingAnnouncementId],
  );

  const previewExistingAttachments = useMemo(
    () =>
      editingAnnouncement?.attachments?.filter(
        (attachment) => !removeAttachmentIds.includes(attachment.id),
      ) ?? [],
    [editingAnnouncement, removeAttachmentIds],
  );

  const canManageAnnouncement = useCallback(
    (announcement: Announcement) => {
      if (isAdmin) {
        return true;
      }

      if (isUserCollaborator) {
        return false;
      }

      return user?.department_id !== null && user?.department_id === announcement.department_id;
    },
    [isAdmin, isUserCollaborator, user?.department_id],
  );

  const resetForm = () => {
    setFormState((current) => ({
      ...INITIAL_FORM_STATE,
      department_id: user?.department_id ? String(user.department_id) : current.department_id,
    }));
    setEditingAnnouncementId(null);
    setShowPreview(false);
    setIsFormModalOpen(false);
    setNewAttachments([]);
    setRemoveAttachmentIds([]);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    // No se llama a resetForm porque al cancelar se descartan los adjuntos
    // pendientes; resetForm ya limpia todo y cierra el modal.
    setIsFormModalOpen(false);
  };

  // Escape cierra el modal. Sin esto el overlay es un callejon sin salida para
  // quien navega con teclado, que es como se revisa la vista en auditoria.
  useEffect(() => {
    if (!isFormModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFormModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFormModalOpen]);

  const handleSubmitAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAccessPublications || !user) {
      return;
    }

    const normalizedTitle = formState.title.trim();
    const normalizedContent = formState.content.trim();
    const selectedDepartmentId = formState.department_id || (user.department_id ? String(user.department_id) : "");

    if (!normalizedTitle || !normalizedContent) {
      setErrorMessage("Completa titulo y contenido antes de guardar.");
      setIsPermissionError(false);
      return;
    }

    if (!isAdmin && !selectedDepartmentId) {
      setErrorMessage("Tu usuario no tiene departamento asignado para publicar.");
      setIsPermissionError(false);
      return;
    }

    if (isAdmin && !formState.publish_all && !selectedDepartmentId) {
      setErrorMessage("Selecciona un departamento o activa \"Publicar para todos los departamentos\".");
      setIsPermissionError(false);
      return;
    }

    setIsSavingAnnouncement(true);
    setErrorMessage(null);
    setIsPermissionError(false);

    try {
      const payload = new FormData();
      payload.append("title", normalizedTitle);
      payload.append("content", normalizedContent);
      payload.append("is_visible", formState.is_visible ? "1" : "0");

      for (const file of newAttachments) {
        payload.append("attachments[]", file);
      }

      for (const attachmentId of removeAttachmentIds) {
        payload.append("remove_attachment_ids[]", String(attachmentId));
      }

      if (editingAnnouncementId) {
        if (isAdmin && !formState.publish_all && selectedDepartmentId) {
          payload.append("department_id", selectedDepartmentId);
        }

        payload.append("_method", "PATCH");

        await apiFetch<Announcement>(`/announcements/${editingAnnouncementId}`, {
          method: "POST",
          body: payload,
        });

        setSuccessMessage(formState.is_visible ? "Publicacion actualizada y visible." : "Publicacion actualizada (oculta).");
      } else {
        if (!isAdmin || !formState.publish_all) {
          payload.append("department_id", selectedDepartmentId);
        }

        if (isAdmin) {
          payload.append("publish_all", formState.publish_all ? "1" : "0");
        }

        await apiFetch<Announcement>("/announcements", {
          method: "POST",
          body: payload,
        });

        if (isAdmin && formState.publish_all) {
          setSuccessMessage(formState.is_visible ? "Publicacion visible creada para todos los departamentos." : "Borrador creado para todos los departamentos.");
        } else {
          setSuccessMessage(formState.is_visible ? "Publicacion creada y visible." : "Publicacion creada como borrador (oculta).");
        }
      }

      resetForm();
      await loadAnnouncements();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para guardar publicaciones.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo guardar la publicacion.");
        setIsPermissionError(false);
      }
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const getAttachmentUrl = useCallback((attachment: AnnouncementAttachment) => {
    if (attachment.file_url && /^https?:\/\//i.test(attachment.file_url)) {
      try {
        const remoteUrl = new URL(attachment.file_url);
        const backendUrl = new URL(backendOrigin);
        const isLocalHost = remoteUrl.hostname === "localhost" || remoteUrl.hostname === "127.0.0.1";

        if (isLocalHost && !remoteUrl.port && backendUrl.port) {
          remoteUrl.port = backendUrl.port;
        }

        return remoteUrl.toString();
      } catch {
        return attachment.file_url;
      }
    }

    if (attachment.file_url) {
      return `${backendOrigin}${attachment.file_url.startsWith("/") ? "" : "/"}${attachment.file_url}`;
    }

    return `${backendOrigin}/storage/${attachment.file_path}`;
  }, [backendOrigin]);

  const handleDownloadAttachment = useCallback(async (announcementId: number, attachment: AnnouncementAttachment) => {
    const token = getAccessToken();

    if (!token) {
      setErrorMessage("Sesion expirada. Inicia sesion nuevamente.");
      setIsPermissionError(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/announcements/${announcementId}/attachments/${attachment.id}/download`, {
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
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.original_name;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setErrorMessage("No se pudo descargar el adjunto.");
      setIsPermissionError(false);
    }
  }, []);

  const handleEditAnnouncement = (announcement: Announcement) => {
    setFormState({
      title: announcement.title,
      content: announcement.content,
      is_visible: announcement.is_visible,
      publish_all: false,
      department_id: announcement.department_id
        ? String(announcement.department_id)
        : (user?.department_id ? String(user.department_id) : ""),
    });
    setEditingAnnouncementId(announcement.id);
    setShowPreview(false);
    setNewAttachments([]);
    setRemoveAttachmentIds([]);
    setIsFormModalOpen(true);
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    const confirmed = window.confirm(`Eliminar la publicacion \"${announcement.title}\"?`);
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsPermissionError(false);

    try {
      await apiFetch(`/announcements/${announcement.id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Publicacion eliminada correctamente.");
      if (editingAnnouncementId === announcement.id) {
        resetForm();
      }
      await loadAnnouncements();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para eliminar esta publicacion.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo eliminar la publicacion.");
        setIsPermissionError(false);
      }
    }
  };

  const handleToggleVisibility = async (announcement: Announcement) => {
    setErrorMessage(null);
    setIsPermissionError(false);
    setIsUpdatingVisibilityId(announcement.id);

    try {
      const nextVisibility = !announcement.is_visible;

      await apiFetch<Announcement>(`/announcements/${announcement.id}`, {
        method: "PATCH",
        body: {
          is_visible: nextVisibility,
        },
      });

      setSuccessMessage(nextVisibility ? "Publicacion marcada como visible." : "Publicacion cambiada a borrador.");
      await loadAnnouncements();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para cambiar la visibilidad.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo actualizar la visibilidad.");
        setIsPermissionError(false);
      }
    } finally {
      setIsUpdatingVisibilityId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="flex min-h-screen w-full">
        <DashboardSidebar
          user={user ? { name: user.name, email: user.email } : null}
          isAdmin={isAdmin}
          isLeader={isUserLeader}
          isNewHire={isUserNewHire}
          canManageAnnouncements={canManageAnnouncements}
          activeRoute="publications"
          statusMessage={isLoadingUser || isLoadingAnnouncements ? "Cargando publicaciones..." : errorMessage ? errorMessage : "Publicaciones sincronizadas"}
        />

        <HelpButton tourId="publications" variant="floating" />

        <section className="min-w-0 flex-1 px-4 py-6 lg:px-6 xl:px-8 2xl:px-10">
          <div className="mx-auto w-full max-w-360 space-y-6">
            <header className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                Publicaciones
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Comparte novedades con tu equipo
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Redacta una publicacion, adjunta los archivos que hagan falta y decide si queda
                visible para todos o se guarda como borrador.
              </p>
            </header>

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

            {!isLoadingAnnouncements && !canAccessPublications ? (
              <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <p className="text-sm text-[var(--muted)]">
                  Solo usuarios autorizados pueden administrar publicaciones.
                </p>
              </section>
            ) : null}

            {canAccessPublications ? (
              <>

                <section
                  data-tour-id="publications-list"
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        Todas las publicaciones
                      </h3>
                      <span className="inline-flex items-center justify-center rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                        {sortedAnnouncements.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      data-tour-id="publications-form-trigger"
                      onClick={openCreateModal}
                      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3.5 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                    >
                      <Plus className="h-4 w-4" />
                      Nueva publicacion
                    </button>
                  </div>

                  <div className="mt-4 min-h-0 space-y-3 overflow-auto pr-1">
                    {isLoadingAnnouncements ? (
                      <p className="text-sm text-[var(--muted)]">Cargando publicaciones...</p>
                    ) : null}

                    {!isLoadingAnnouncements && sortedAnnouncements.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        Aun no hay publicaciones disponibles.
                      </p>
                    ) : null}

                    {sortedAnnouncements.map((announcement) => {
                      const canManageCurrent = canManageAnnouncement(announcement);
                      const imageAttachments = (announcement.attachments ?? []).filter(
                        (attachment) =>
                          Boolean(attachment.is_image) || (attachment.mime_type?.startsWith("image/") ?? false),
                      );
                      const fileAttachments = (announcement.attachments ?? []).filter(
                        (attachment) =>
                          !(Boolean(attachment.is_image) || (attachment.mime_type?.startsWith("image/") ?? false)),
                      );
                      const contentPreview = makePreviewText(announcement.content);
                      const hasLongContent = contentPreview.length < announcement.content.replace(/\s+/g, " ").trim().length;

                      return (
                        <article
                          key={announcement.id}
                          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--border-strong)]"
                        >
                          <div className="px-4 pt-4 pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
                                  {(announcement.creator?.name ?? "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                    {announcement.creator?.name ?? "Usuario"}
                                  </p>
                                  <p className="truncate text-xs text-[var(--muted)]">
                                    {announcement.department?.name ? `${announcement.department.name} • Publicacion interna` : "General • Publicacion interna"}
                                  </p>
                                  <p className="text-xs text-[var(--muted-soft)]">
                                    {formatRelativeTime(announcement.created_at)}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  announcement.is_visible
                                    ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                                    : "bg-[color:var(--warning)]/12 text-[color:var(--warning)]",
                                )}
                              >
                                {announcement.is_visible ? "Visible" : "Borrador"}
                              </span>
                            </div>

                            <h4 className="mt-3 text-base font-semibold tracking-tight text-[var(--foreground)]">
                              {announcement.title}
                            </h4>
                            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                              {contentPreview}
                            </p>
                            {hasLongContent ? (
                              <button
                                type="button"
                                className="mt-1 text-sm font-medium text-[var(--primary)] hover:underline"
                              >
                                Ver mas
                              </button>
                            ) : null}
                          </div>

                          {imageAttachments.length > 0 ? (
                            <div className="border-y border-[var(--border)] bg-[var(--surface-muted)]">
                              <figure className="overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getAttachmentUrl(imageAttachments[0])}
                                  alt={imageAttachments[0].original_name}
                                  className="h-auto max-h-[560px] w-full object-cover"
                                />
                              </figure>
                            </div>
                          ) : null}

                          <div className="px-4 py-3 text-xs text-[var(--muted)]">
                            {imageAttachments.length + fileAttachments.length > 0
                              ? `${imageAttachments.length + fileAttachments.length} ${
                                  imageAttachments.length + fileAttachments.length === 1
                                    ? "adjunto en esta publicacion"
                                    : "adjuntos en esta publicacion"
                                }`
                              : "Publicacion sin adjuntos"}
                          </div>

                          {fileAttachments.length > 0 ? (
                            <div className="px-4 pb-3">
                              <div className="flex flex-wrap gap-2">
                                {fileAttachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    type="button"
                                    onClick={() => void handleDownloadAttachment(announcement.id, attachment)}
                                    className="inline-flex max-w-full items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                                  >
                                    <Download className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                                    <span className="truncate">{attachment.original_name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="grid grid-cols-2 border-t border-[var(--border)] text-sm text-[var(--muted)] sm:grid-cols-4">
                            <button type="button" className="px-3 py-2.5 font-medium transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">Recomendar</button>
                            <button type="button" className="px-3 py-2.5 font-medium transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">Comentar</button>
                            <button type="button" className="px-3 py-2.5 font-medium transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">Compartir</button>
                            <button type="button" className="px-3 py-2.5 font-medium transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">Enviar</button>
                          </div>

                          {canManageCurrent ? (
                            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
                              <button
                                type="button"
                                onClick={() => void handleToggleVisibility(announcement)}
                                disabled={isUpdatingVisibilityId === announcement.id}
                                className={cn(
                                  "inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                                  announcement.is_visible
                                    ? "border-[color:var(--warning)]/40 text-[color:var(--warning)] hover:bg-[color:var(--warning)]/10"
                                    : "border-[color:var(--success)]/40 text-[color:var(--success)] hover:bg-[color:var(--success)]/10",
                                )}
                              >
                                {isUpdatingVisibilityId === announcement.id
                                  ? "Actualizando..."
                                  : (announcement.is_visible ? "Pasar a borrador" : "Hacer visible")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditAnnouncement(announcement)}
                                className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteAnnouncement(announcement)}
                                className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--danger)]/40 px-3 text-sm font-semibold text-[color:var(--danger)] transition hover:bg-[color:var(--danger)]/10"
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : null}
            {isFormModalOpen && canAccessPublications ? (
              <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.button
                    type="button"
                    aria-label="Cerrar"
                    onClick={closeFormModal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingAnnouncementId ? "Editar publicacion" : "Nueva publicacion"}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)]"
                  >
                    <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                          {editingAnnouncementId ? "Editar publicacion" : "Nueva publicacion"}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Adjunta los archivos que hagan falta y decide si queda visible o como borrador.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            formState.is_visible
                              ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                              : "bg-[color:var(--warning)]/12 text-[color:var(--warning)]",
                          )}
                        >
                          {formState.is_visible ? "Visible" : "Borrador"}
                        </span>
                        <button
                          type="button"
                          onClick={closeFormModal}
                          aria-label="Cerrar"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
                      <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
                        <div>
                          <label
                            htmlFor="announcement-title"
                            className="text-sm font-medium text-[var(--foreground)]"
                          >
                            Titulo
                          </label>
                          <input
                            id="announcement-title"
                            type="text"
                            value={formState.title}
                            onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                            placeholder="Ej. Nueva politica de vacaciones"
                            className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="announcement-attachments"
                            className="text-sm font-medium text-[var(--foreground)]"
                          >
                            Adjuntos (imagenes o archivos)
                          </label>
                          <input
                            id="announcement-attachments"
                            type="file"
                            multiple
                            onChange={(event) => {
                              const files = Array.from(event.target.files ?? []);
                              setNewAttachments((current) => [...current, ...files]);
                              event.currentTarget.value = "";
                            }}
                            className="mt-1.5 block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--primary-hover)]"
                          />
                          {newAttachments.length > 0 ? (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-xs text-[var(--muted)]">
                                {newAttachments.length}{" "}
                                {newAttachments.length === 1
                                  ? "archivo nuevo seleccionado"
                                  : "archivos nuevos seleccionados"}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {newAttachments.map((file, index) => (
                                  <button
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                    type="button"
                                    onClick={() => setNewAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                                    aria-label={`Quitar ${file.name}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                  >
                                    <X className="h-3 w-3" />
                                    <span className="max-w-40 truncate">{file.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <label
                            htmlFor="announcement-department"
                            className="text-sm font-medium text-[var(--foreground)]"
                          >
                            Departamento
                          </label>
                          <DepartmentSelect
                            id="announcement-department"
                            className="mt-1.5"
                            value={formState.department_id}
                            onChange={(value) =>
                              setFormState((current) => ({ ...current, department_id: value }))
                            }
                            disabled={!isAdmin || formState.publish_all}
                            options={departmentSelectOptions}
                            placeholder="Selecciona un departamento"
                          />
                        </div>

                        {editingAnnouncementId ? (
                          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/60 p-3">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                              Adjuntos actuales
                            </p>
                            <div className="mt-2 space-y-2">
                              {editingAnnouncement
                                ?.attachments?.map((attachment) => (
                                  <label
                                    key={attachment.id}
                                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={removeAttachmentIds.includes(attachment.id)}
                                      onChange={(event) => {
                                        setRemoveAttachmentIds((current) =>
                                          event.target.checked
                                            ? [...current, attachment.id]
                                            : current.filter((id) => id !== attachment.id),
                                        );
                                      }}
                                      className="h-4 w-4 shrink-0 rounded border-[var(--border-strong)] accent-[color:var(--danger)]"
                                    />
                                    <span className="truncate">Quitar {attachment.original_name}</span>
                                  </label>
                                ))}
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <label
                            htmlFor="announcement-content"
                            className="text-sm font-medium text-[var(--foreground)]"
                          >
                            Contenido
                          </label>
                          <textarea
                            id="announcement-content"
                            value={formState.content}
                            onChange={(event) => setFormState((current) => ({ ...current, content: event.target.value }))}
                            rows={5}
                            placeholder="Comparte una actualizacion para el equipo..."
                            className="mt-1.5 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--border-strong)]">
                            <input
                              type="checkbox"
                              checked={formState.is_visible}
                              onChange={(event) => setFormState((current) => ({ ...current, is_visible: event.target.checked }))}
                              className="h-4 w-4 shrink-0 rounded border-[var(--border-strong)] accent-[var(--primary)]"
                            />
                            Marcar como visible
                          </label>

                          {isAdmin ? (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--border-strong)]">
                              <input
                                type="checkbox"
                                checked={formState.publish_all}
                                onChange={(event) => setFormState((current) => ({ ...current, publish_all: event.target.checked }))}
                                className="h-4 w-4 shrink-0 rounded border-[var(--border-strong)] accent-[var(--primary)]"
                              />
                              Publicar para todos los departamentos
                            </label>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowPreview((current) => !current)}
                            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                          >
                            {showPreview ? "Ocultar vista previa" : "Ver vista previa"}
                          </button>
                          {editingAnnouncementId ? (
                            <button
                              type="button"
                              onClick={resetForm}
                              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                            >
                              Cancelar edicion
                            </button>
                          ) : null}
                          <button
                            type="submit"
                            disabled={isSavingAnnouncement}
                            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingAnnouncement ? "Guardando..." : editingAnnouncementId ? "Actualizar" : "Crear publicacion"}
                          </button>
                        </div>
                      </form>

                        {showPreview ? (
                          <article className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/40 p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
                                {(user?.name ?? "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--foreground)]">
                                  {user?.name ?? "Usuario"}
                                </p>
                                <p className="text-xs text-[var(--muted)]">Vista previa · ahora</p>
                              </div>
                            </div>
                            <h4 className="mt-3 text-base font-semibold text-[var(--foreground)]">
                              {formState.title.trim() || "Titulo de la publicacion"}
                            </h4>
                            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-[var(--muted)]">
                              {formState.content.trim() || "Aqui veras la vista previa del contenido."}
                            </p>

                            {previewExistingAttachments.length > 0 || newAttachmentPreviews.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                {previewExistingAttachments.map((attachment) => {
                                  const isImage = Boolean(attachment.is_image) || (attachment.mime_type?.startsWith("image/") ?? false);

                                  if (isImage) {
                                    return (
                                      <figure key={`existing-${attachment.id}`} className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={getAttachmentUrl(attachment)}
                                          alt={attachment.original_name}
                                          className="h-auto max-h-96 w-full object-cover"
                                        />
                                        <figcaption className="px-3 py-2 text-xs text-[var(--muted)]">
                                          {attachment.original_name}
                                        </figcaption>
                                      </figure>
                                    );
                                  }

                                  return (
                                    <div
                                      key={`existing-${attachment.id}`}
                                      className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]"
                                    >
                                      Archivo adjunto: {attachment.original_name}
                                    </div>
                                  );
                                })}

                                {newAttachmentPreviews.map((preview) => {
                                  if (preview.isImage) {
                                    return (
                                      <figure key={`new-${preview.file.name}-${preview.file.lastModified}`} className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={preview.objectUrl}
                                          alt={preview.file.name}
                                          className="h-auto max-h-96 w-full object-cover"
                                        />
                                        <figcaption className="px-3 py-2 text-xs text-[var(--muted)]">
                                          Nuevo: {preview.file.name}
                                        </figcaption>
                                      </figure>
                                    );
                                  }

                                  return (
                                    <div
                                      key={`new-${preview.file.name}-${preview.file.lastModified}`}
                                      className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]"
                                    >
                                      Nuevo archivo: {preview.file.name}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  formState.is_visible
                                    ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                                    : "bg-[color:var(--warning)]/12 text-[color:var(--warning)]",
                                )}
                              >
                                {formState.is_visible ? "Estado: Visible" : "Estado: Borrador (oculto)"}
                              </span>
                              {isAdmin && formState.publish_all ? (
                                <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                                  Alcance: Todos los departamentos
                                </span>
                              ) : null}
                            </div>
                          </article>
                        ) : null}
                    </div>
                  </motion.div>
                </div>
              </AnimatePresence>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
