"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Loader2,
  Trash2,
} from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DepartmentSelect } from "@/components/department-select";
import type { DepartmentSelectOption } from "@/components/department-select";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { resolveDepartmentColor } from "@/lib/department-color";
import { cn } from "@/lib/cn";
import { isAdministrator, isLeader, isNewHire } from "@/lib/roles";

const USERS_PER_PAGE = 15;

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

type Department = {
  id: number;
  name: string;
  color?: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: Array<{
    id: number;
    name: string;
    can_post_announcements?: boolean;
    can_manage_department?: boolean;
    department_id?: number | null;
  }>;
};

type DepartmentRole = {
  id: number;
  name: string;
  can_post_announcements?: boolean;
  can_manage_department?: boolean;
  department_id?: number | null;
};

type UserFormState = {
  name: string;
  email: string;
  password: string;
  department_id: string;
  role_ids: number[];
};

const INITIAL_FORM_STATE: UserFormState = {
  name: "",
  email: "",
  password: "",
  department_id: "",
  role_ids: [],
};

export default function UsersPage() {
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUserId, setIsDeletingUserId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [canAccessUsers, setCanAccessUsers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState<UserFormState>(INITIAL_FORM_STATE);
  const [availableRoles, setAvailableRoles] = useState<DepartmentRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [page, setPage] = useState(1);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const usersListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingUserId && formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingUserId]);

  const loadUsers = useCallback(async () => {
    const usersResponse = await apiFetch<{ data: User[] }>("/users", { method: "GET" });
    setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
  }, []);

  const loadDepartments = useCallback(async () => {
    const depsResponse = await apiFetch<{ data: Department[] }>("/departments", { method: "GET" });
    setDepartments(Array.isArray(depsResponse.data) ? depsResponse.data : []);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadPageData = async () => {
      setIsLoadingUser(true);
      setIsLoadingUsers(true);
      setErrorMessage(null);
      setIsPermissionError(false);

      try {
        const meResponse = await apiFetch<MeResponse>("/me", { method: "GET" });

        if (ignore) {
          return;
        }

        const allowed = isAdministrator(meResponse.data);
        setUser(meResponse.data);
        setCanAccessUsers(allowed);

        if (!allowed) {
          setUsers([]);
          setErrorMessage("Solo administradores pueden gestionar usuarios.");
          setIsPermissionError(true);
          return;
        }

        await Promise.all([loadUsers(), loadDepartments()]);
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiClientError && error.status === 401) {
            setErrorMessage("No autenticado. Inicia sesión nuevamente.");
            setIsPermissionError(false);
            clearAccessToken();
          } else if (error instanceof ApiClientError && error.status === 403) {
            setErrorMessage("No tienes permisos para gestionar usuarios.");
            setIsPermissionError(true);
          } else if (error instanceof ApiClientError) {
            setErrorMessage(error.message);
            setIsPermissionError(false);
          } else {
            setErrorMessage("No se pudo cargar los usuarios.");
            setIsPermissionError(false);
          }
        }
      } finally {
        if (!ignore) {
          setIsLoadingUser(false);
          setIsLoadingUsers(false);
        }
      }
    };

    void loadPageData();

    return () => {
      ignore = true;
    };
  }, [loadUsers, loadDepartments]);

  useEffect(() => {
    const deptId = formState.department_id ? parseInt(formState.department_id, 10) : null;

    if (!deptId || Number.isNaN(deptId)) {
      queueMicrotask(() => setAvailableRoles([]));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => setIsLoadingRoles(true));
    apiFetch<{ data: DepartmentRole[] }>(`/departments/${deptId}/roles`, { method: "GET" })
      .then((response) => {
        if (!cancelled) {
          setAvailableRoles(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableRoles([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRoles(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [formState.department_id]);

  // Cambiar filtro o busqueda acorta la lista: se vuelve a la página 1 desde el
  // handler en vez de un efecto, para no desincronizar un setState en un efecto.
  const handleFilterChange = (value: string) => {
    setSelectedDepartmentFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };
  const users_sorted = users.slice().sort((a, b) => a.name.localeCompare(b.name));
  const departments_sorted = departments.slice().sort((a, b) => a.name.localeCompare(b.name));

  // Opciones del desplegable de departamento del formulario de alta de usuario.
  // El color viaja con la opción para que se vea al desplegar la lista.
  const departmentSelectOptions = useMemo<DepartmentSelectOption[]>(
    () => [
      { value: "", label: "Sin asignar" },
      ...departments_sorted.map((dept) => ({
        value: String(dept.id),
        label: dept.name,
        color: resolveDepartmentColor(dept),
      })),
    ],
    [departments_sorted],
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredUsers = users_sorted.filter((u) => {
    const matchesDepartment =
      selectedDepartmentFilter === "all"
        ? true
        : selectedDepartmentFilter === "unassigned"
          ? u.department_id === null
          : u.department_id === Number(selectedDepartmentFilter);

    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      u.name.toLowerCase().includes(normalizedSearchTerm) ||
      u.email.toLowerCase().includes(normalizedSearchTerm);

    return matchesDepartment && matchesSearch;
  });

  const usersWithoutDepartmentCount = users_sorted.filter((u) => u.department_id === null).length;

  const getDepartmentUsersCount = (departmentId: number): number =>
    users_sorted.filter((u) => u.department_id === departmentId).length;

  /*
   * `/users` devuelve la colección completa sin paginar (UserController::index
   * hace ->get()). Con 300 registros eso pintaba 300 tarjetas en el DOM de una
   * vez. Aquí se pagina en cliente: el filtro y la búsqueda ya operaban sobre el
   * conjunto completo, así que solo hay que recortar la vista.
   */
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );
  const firstShown = filteredUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const lastShown = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  // Al cambiar de página el listado se reconstruye entero arriba; sin esto se
  // hereda el scroll anterior y la página nueva aparece a media altura.
  useEffect(() => {
    usersListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const currentFilterLabel =
    selectedDepartmentFilter === "all"
      ? "Todos los departamentos"
      : selectedDepartmentFilter === "unassigned"
        ? "Sin departamento"
        : departments_sorted.find((dept) => dept.id === Number(selectedDepartmentFilter))?.name ??
          "Departamento";

  const getDepartmentName = (deptId: number | null): string => {
    if (!deptId) return "Sin asignar";
    return departments.find((d) => d.id === deptId)?.name ?? "Desconocido";
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingUserId(null);
  };

  const handleSubmitUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAccessUsers) {
      return;
    }

    const normalizedName = formState.name.trim();
    const normalizedEmail = formState.email.trim();
    const deptId = formState.department_id ? parseInt(formState.department_id, 10) : null;

    if (!normalizedName) {
      setErrorMessage("El nombre del usuario es obligatorio.");
      setIsPermissionError(false);
      return;
    }

    if (!normalizedEmail) {
      setErrorMessage("El email del usuario es obligatorio.");
      setIsPermissionError(false);
      return;
    }

    if (!editingUserId && !formState.password) {
      setErrorMessage("La contraseña es obligatoria para nuevos usuarios.");
      setIsPermissionError(false);
      return;
    }

    setIsSavingUser(true);
    setErrorMessage(null);
    setIsPermissionError(false);

    try {
      const payload: {
        name: string;
        email: string;
        department_id: number | null;
        password?: string;
      } = {
        name: normalizedName,
        email: normalizedEmail,
        department_id: deptId,
      };

      if (formState.password) {
        payload.password = formState.password;
      }

      let savedUserId: number;

      if (editingUserId) {
        await apiFetch<User>(`/users/${editingUserId}`, {
          method: "PATCH",
          body: payload,
        });
        savedUserId = editingUserId;

        setSuccessMessage("Usuario actualizado correctamente.");
      } else {
        const created = await apiFetch<User>("/users", {
          method: "POST",
          body: payload,
        });
        savedUserId = created.id;

        setSuccessMessage("Usuario creado correctamente.");
      }

      const deptRoles = deptId
        ? availableRoles.filter((role) => role.department_id === deptId).map((role) => role.id)
        : [];

      const onlyValidRoleIds = formState.role_ids.filter((id) => deptRoles.includes(id));

      if (deptId && onlyValidRoleIds.length > 0) {
        await apiFetch(`/users/${savedUserId}/roles`, {
          method: "PUT",
          body: { role_ids: onlyValidRoleIds },
        });
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para guardar usuarios.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo guardar el usuario.");
        setIsPermissionError(false);
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleEditUser = async (u: User) => {
    setFormState({
      name: u.name,
      email: u.email,
      password: "",
      department_id: u.department_id?.toString() ?? "",
      role_ids: (u.roles ?? []).map((role) => role.id),
    });
    setEditingUserId(u.id);

    try {
      const response = await apiFetch<{ data: { roles: Array<{ id: number }> } }>(
        `/users/${u.id}/roles`,
        { method: "GET" },
      );
      const currentRoleIds = Array.isArray(response.data.roles)
        ? response.data.roles.map((role) => role.id)
        : [];
      setFormState((current) => ({ ...current, role_ids: currentRoleIds }));
    } catch {
      // best-effort, keep any preloaded roles
    }
  };

  const handleDeleteUser = async (u: User) => {
    const confirmed = window.confirm(`Eliminar usuario \"${u.name}\"?`);
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsPermissionError(false);
    setIsDeletingUserId(u.id);

    try {
      await apiFetch(`/users/${u.id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Usuario eliminado correctamente.");
      if (editingUserId === u.id) {
        resetForm();
      }
      await loadUsers();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para eliminar este usuario.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo eliminar el usuario.");
        setIsPermissionError(false);
      }
    } finally {
      setIsDeletingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="flex min-h-screen w-full">
        <DashboardSidebar
          user={user ? { name: user.name, email: user.email } : null}
          isAdmin={isAdministrator(user)}
          isLeader={isLeader(user)}
          isNewHire={isNewHire(user)}
          canManageAnnouncements={Boolean(user?.can_manage_announcements)}
          activeRoute="users"
          statusMessage={isLoadingUser || isLoadingUsers ? "Cargando usuarios..." : errorMessage ?? "Listo"}
        />

        <section className="min-w-0 flex flex-1 flex-col px-4 py-6 lg:px-6 xl:px-8 2xl:px-10">
          <div className="mx-auto flex min-h-0 w-full max-w-360 flex-1 flex-col space-y-4">

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

            {!isLoadingUsers && !canAccessUsers ? (
              <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <p className="text-base text-[var(--muted)]">Solo usuarios autorizados pueden gestionar usuarios.</p>
              </section>
            ) : null}

            {canAccessUsers ? (
              <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[370px_minmax(0,1fr)]">
                <section className="h-fit rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm" ref={formSectionRef}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {editingUserId ? "Editar usuario" : "Nuevo usuario"}
                    </h3>
                  </div>

                  <form onSubmit={handleSubmitUser} className="mt-3 space-y-3">
                    <div>
                      <label htmlFor="user-name" className="text-sm font-medium text-[var(--foreground)]">
                        Nombre
                      </label>
                      <input
                        id="user-name"
                        type="text"
                        value={formState.name}
                        onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Ej. Juan Pérez"
                        className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="user-email" className="text-sm font-medium text-[var(--foreground)]">
                        Email
                      </label>
                      <input
                        id="user-email"
                        type="email"
                        value={formState.email}
                        onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                        placeholder="correo@empresa.com"
                        className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="user-password" className="text-sm font-medium text-[var(--foreground)]">
                        {editingUserId ? "Contraseña (opcional)" : "Contraseña"}
                      </label>
                      <input
                        id="user-password"
                        type="password"
                        value={formState.password}
                        onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Mínimo 8 caracteres"
                        className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="user-department" className="text-sm font-medium text-[var(--foreground)]">
                        Departamento
                      </label>
                      <DepartmentSelect
                        id="user-department"
                        className="mt-1"
                        value={formState.department_id}
                        onChange={(value) =>
                          setFormState((current) => ({
                            ...current,
                            department_id: value,
                            role_ids: [],
                          }))
                        }
                        options={departmentSelectOptions}
                        placeholder="Selecciona un departamento"
                      />
                    </div>

                    {formState.department_id ? (
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            Roles del departamento
                          </span>
                          {isLoadingRoles ? (
                            <span className="text-xs text-[var(--muted)]">Cargando...</span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">
                              {formState.role_ids.length}/{availableRoles.length} seleccionados
                            </span>
                          )}
                        </div>
                        {!isLoadingRoles && availableRoles.length === 0 ? (
                          <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-[var(--background)]/40 px-3 py-2 text-xs text-[var(--muted)]">
                            Este departamento aun no tiene roles. Crea uno desde /dashboard/departments.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {availableRoles.map((role) => {
                              const isChecked = formState.role_ids.includes(role.id);
                              return (
                                <label
                                  key={role.id}
                                  className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition hover:border-[var(--primary)]"
                                >
                                  <span className="relative inline-flex shrink-0 pt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(event) => {
                                        const checked = event.target.checked;
                                        setFormState((current) => ({
                                          ...current,
                                          role_ids: checked
                                            ? [...current.role_ids, role.id]
                                            : current.role_ids.filter((id) => id !== role.id),
                                        }));
                                      }}
                                      className="peer sr-only"
                                    />
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        "h-4 w-4 rounded-[var(--radius-sm)] border transition",
                                        "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--surface)]",
                                        isChecked
                                          ? "border-[var(--primary)] bg-[var(--primary)]"
                                          : "border-[var(--border-strong)] bg-[var(--surface)]",
                                      )}
                                    >
                                      <svg
                                        viewBox="0 0 16 16"
                                        className={cn(
                                          "absolute inset-0 m-auto h-3 w-3 text-white transition",
                                          isChecked ? "scale-100 opacity-100" : "scale-50 opacity-0",
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
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-[var(--foreground)]">
                                      {role.name}
                                    </span>
                                    <span className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-[var(--muted)]">
                                      {role.can_manage_department ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[var(--primary)]">
                                          Lider
                                        </span>
                                      ) : null}
                                      {role.can_post_announcements ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-1.5 py-0.5 text-[var(--accent)]">
                                          Publica anuncios
                                        </span>
                                      ) : null}
                                      {!role.can_manage_department && !role.can_post_announcements ? (
                                        <span>Permiso estándar</span>
                                      ) : null}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {editingUserId ? (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                        >
                          Cancelar
                        </button>
                      ) : null}
                      <button
                        type="submit"
                        disabled={isSavingUser}
                        className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingUser ? "Guardando..." : editingUserId ? "Actualizar" : "Crear"}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-[var(--foreground)]">Usuarios del sistema</h3>
                      <span className="rounded-full bg-[var(--background)] px-3 py-1 text-sm font-medium text-[var(--foreground)]">
                        {filteredUsers.length} / {users_sorted.length}
                      </span>
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">Buscar por departamento</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {/*
                         * "Todos" no es un departamento más: es la vista completa.
                         * Por eso lleva tono primario (azul) en vez del accent
                         * que comparten los filtros concretos, y se mantiene
                         * distinguible también en reposo, con borde y fondo
                         * suaves en vez del gris neutro de los chips.
                         */}
                        <button
                          type="button"
                          onClick={() => handleFilterChange("all")}
                          aria-pressed={selectedDepartmentFilter === "all"}
                          className={cn(
                            "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition",
                            selectedDepartmentFilter === "all"
                              ? "bg-[var(--primary)] text-white"
                              : "border border-[var(--primary)]/40 bg-[var(--primary-soft)] text-[var(--primary)] hover:border-[var(--primary)]/60",
                          )}
                        >
                          Todos ({users_sorted.length})
                        </button>

                        {departments_sorted.map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => handleFilterChange(String(dept.id))}
                            aria-pressed={selectedDepartmentFilter === String(dept.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition",
                              selectedDepartmentFilter === String(dept.id)
                                ? "border border-[var(--foreground)]/25 bg-[var(--foreground)]/10 text-[var(--foreground)] backdrop-blur-sm"
                                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: resolveDepartmentColor(dept) }}
                            />
                            {dept.name} ({getDepartmentUsersCount(dept.id)})
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleFilterChange("unassigned")}
                          aria-pressed={selectedDepartmentFilter === "unassigned"}
                          className={cn(
                            "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition",
                            selectedDepartmentFilter === "unassigned"
                              ? "border border-[var(--foreground)]/25 bg-[var(--foreground)]/10 text-[var(--foreground)] backdrop-blur-sm"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
                          )}
                        >
                          Sin departamento ({usersWithoutDepartmentCount})
                        </button>
                      </div>

                      <div className="mt-3">
                        <label htmlFor="users-search" className="text-sm font-medium text-[var(--foreground)]">
                          Buscar en {currentFilterLabel.toLowerCase()}
                        </label>
                        <input
                          id="users-search"
                          type="text"
                          value={searchTerm}
                          onChange={(event) => handleSearchChange(event.target.value)}
                          placeholder="Buscar por nombre o email"
                          className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div ref={usersListRef} className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                    {isLoadingUsers ? (
                      <p className="text-sm text-[var(--muted)]">Cargando usuarios...</p>
                    ) : null}

                    {!isLoadingUsers && users_sorted.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">Aún no hay usuarios.</p>
                    ) : null}

                    {!isLoadingUsers && users_sorted.length > 0 && filteredUsers.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        No hay usuarios para el filtro seleccionado.
                      </p>
                    ) : null}

                    {pagedUsers.map((u) => (
                      <article
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--border-strong)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-[var(--muted)]">{u.email}</p>
                          <span className="mt-1 inline-flex items-center rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                            {getDepartmentName(u.department_id)}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditUser(u)}
                            aria-label={`Editar ${u.name}`}
                            title="Editar usuario"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteUser(u)}
                            disabled={isDeletingUserId === u.id}
                            aria-label={`Eliminar ${u.name}`}
                            title="Eliminar usuario"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted-soft)] transition hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeletingUserId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {totalPages > 1 ? (
                    <nav
                      aria-label="Paginación de usuarios"
                      className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3"
                    >
                      <p className="text-xs text-[var(--muted)]">
                        Mostrando {firstShown}-{lastShown} de {filteredUsers.length}
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
                          onClick={() =>
                            setPage((current) => Math.min(totalPages, current + 1))
                          }
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
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
