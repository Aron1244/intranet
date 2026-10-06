"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Edit2,
  Loader2,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { isAdministrator, isLeader, isNewHire } from "@/lib/roles";
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

type Department = {
  id: number;
  name: string;
  description?: string | null;
};

type Role = {
  id: number;
  name: string;
  department_id: number;
  can_post_announcements: boolean;
  created_at: string;
  updated_at: string;
};

type DepartmentFormState = {
  name: string;
  description: string;
};

type RoleFormState = {
  name: string;
  can_post_announcements: boolean;
};

const INITIAL_DEPT_FORM_STATE: DepartmentFormState = {
  name: "",
  description: "",
};

const INITIAL_ROLE_FORM_STATE: RoleFormState = {
  name: "",
  can_post_announcements: false,
};

export default function DepartmentsPage() {
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isDeletingDepartmentId, setIsDeletingDepartmentId] = useState<number | null>(null);
  const [isDeletingRoleId, setIsDeletingRoleId] = useState<number | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [canAccessDepartments, setCanAccessDepartments] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [deptFormState, setDeptFormState] = useState<DepartmentFormState>(INITIAL_DEPT_FORM_STATE);
  const [roleFormState, setRoleFormState] = useState<RoleFormState>(INITIAL_ROLE_FORM_STATE);
  const [deptSearchTerm, setDeptSearchTerm] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const deptFormSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingDepartmentId && deptFormSectionRef.current) {
      deptFormSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingDepartmentId]);

  const loadDepartments = useCallback(async () => {
    try {
      const depsResponse = await apiFetch<{ data: Department[] }>("/departments", { method: "GET" });
      setDepartments(Array.isArray(depsResponse.data) ? depsResponse.data : []);
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No se pudo cargar los departamentos.");
      }
    } finally {
      setIsLoadingDepartments(false);
    }
  }, []);

  const loadRolesByDepartment = useCallback(async (departmentId: number) => {
    if (!departmentId) return;
    
    setIsLoadingRoles(true);
    try {
      const rolesResponse = await apiFetch<{ data: Role[] }>(`/departments/${departmentId}/roles`, {
        method: "GET",
      });
      setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No se pudo cargar los roles del departamento.");
      }
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadPageData = async () => {
      setIsLoadingUser(true);
      setIsLoadingDepartments(true);
      setErrorMessage(null);
      setIsPermissionError(false);

      try {
        const meResponse = await apiFetch<MeResponse>("/me", { method: "GET" });

        if (ignore) {
          return;
        }

        const allowed = isAdministrator(meResponse.data);
        setUser(meResponse.data);
        setCanAccessDepartments(allowed);

        if (!allowed) {
          setDepartments([]);
          setErrorMessage("Solo administradores pueden gestionar departamentos y roles.");
          setIsPermissionError(true);
          return;
        }

        await loadDepartments();
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiClientError && error.status === 401) {
            setErrorMessage("No autenticado. Inicia sesion nuevamente.");
            setIsPermissionError(false);
            clearAccessToken();
          } else if (error instanceof ApiClientError && error.status === 403) {
            setErrorMessage("No tienes permisos para gestionar departamentos.");
            setIsPermissionError(true);
          } else if (error instanceof ApiClientError) {
            setErrorMessage(error.message);
            setIsPermissionError(false);
          } else {
            setErrorMessage("No se pudo cargar los departamentos.");
            setIsPermissionError(false);
          }
        }
      } finally {
        if (!ignore) {
          setIsLoadingUser(false);
        }
      }
    };

    void loadPageData();

    return () => {
      ignore = true;
    };
  }, [loadDepartments]);

  const departments_sorted = departments.slice().sort((a, b) => a.name.localeCompare(b.name));
  const filteredDepartments = useMemo(() => {
    const query = deptSearchTerm.trim().toLowerCase();
    if (!query) {
      return departments_sorted;
    }
    return departments_sorted.filter((dept) =>
      dept.name.toLowerCase().includes(query) ||
      (dept.description ?? "").toLowerCase().includes(query),
    );
  }, [departments_sorted, deptSearchTerm]);
  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId);
  const roles_sorted = roles.slice().sort((a, b) => a.name.localeCompare(b.name));

  const resetDeptForm = () => {
    setDeptFormState(INITIAL_DEPT_FORM_STATE);
    setEditingDepartmentId(null);
  };

  const resetRoleForm = () => {
    setRoleFormState(INITIAL_ROLE_FORM_STATE);
    setEditingRoleId(null);
  };

  const populateRoleForm = (role: Role) => {
    setRoleFormState({
      name: role.name,
      can_post_announcements: role.can_post_announcements,
    });
    setEditingRoleId(role.id);
    setSelectedRoleId(role.id);
  };

  const handleSubmitDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAccessDepartments) {
      return;
    }

    const normalizedName = deptFormState.name.trim();
    const normalizedDescription = deptFormState.description.trim();

    if (!normalizedName) {
      setErrorMessage("El nombre del departamento es obligatorio.");
      setIsPermissionError(false);
      return;
    }

    setIsSavingDepartment(true);
    setErrorMessage(null);
    setIsPermissionError(false);

    try {
      const payload = {
        name: normalizedName,
        description: normalizedDescription || null,
      };

      if (editingDepartmentId) {
        await apiFetch<Department>(`/departments/${editingDepartmentId}`, {
          method: "PATCH",
          body: payload,
        });

        setSuccessMessage("Departamento actualizado correctamente.");
      } else {
        await apiFetch<Department>("/departments", {
          method: "POST",
          body: payload,
        });

        setSuccessMessage("Departamento creado correctamente.");
      }

      resetDeptForm();
      await loadDepartments();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para guardar departamentos.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo guardar el departamento.");
        setIsPermissionError(false);
      }
    } finally {
      setIsSavingDepartment(false);
    }
  };

  const handleSubmitRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAccessDepartments || !selectedDepartmentId) {
      return;
    }

    const normalizedName = roleFormState.name.trim();

    if (!normalizedName) {
      setErrorMessage("El nombre del rol es obligatorio.");
      setIsPermissionError(false);
      return;
    }

    setIsSavingRole(true);
    setErrorMessage(null);
    setIsPermissionError(false);

    try {
      const payload = {
        name: normalizedName,
        department_id: selectedDepartmentId,
        can_post_announcements: roleFormState.can_post_announcements,
      };

      if (editingRoleId) {
        await apiFetch<Role>(`/roles/${editingRoleId}`, {
          method: "PATCH",
          body: payload,
        });

        setSuccessMessage("Rol actualizado correctamente.");
      } else {
        await apiFetch<Role>("/roles", {
          method: "POST",
          body: payload,
        });

        setSuccessMessage("Rol creado correctamente.");
      }

      resetRoleForm();
      setSelectedRoleId(null);
      await loadRolesByDepartment(selectedDepartmentId);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para guardar roles.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo guardar el rol.");
        setIsPermissionError(false);
      }
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleEditDepartment = (dept: Department) => {
    setDeptFormState({
      name: dept.name,
      description: dept.description ?? "",
    });
    setEditingDepartmentId(dept.id);
  };

  const handleEditRole = (role: Role) => {
    populateRoleForm(role);
    setIsRoleModalOpen(true);
  };

  const openCreateRoleModal = useCallback(() => {
    if (!selectedDepartmentId) {
      return;
    }
    setSelectedRoleId(null);
    resetRoleForm();
    setIsRoleModalOpen(true);
  }, [selectedDepartmentId]);

  const closeRoleModal = useCallback(() => {
    if (isSavingRole) {
      return;
    }
    setIsRoleModalOpen(false);
    setSelectedRoleId(null);
    resetRoleForm();
  }, [isSavingRole]);

  const handleDeleteDepartment = async (dept: Department) => {
    const confirmed = window.confirm(`Eliminar departamento "${dept.name}" y todos sus roles?`);
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsPermissionError(false);
    setIsDeletingDepartmentId(dept.id);

    try {
      await apiFetch(`/departments/${dept.id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Departamento eliminado correctamente.");
      if (selectedDepartmentId === dept.id) {
        setSelectedDepartmentId(null);
        setRoles([]);
      }
      await loadDepartments();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para eliminar departamentos.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo eliminar el departamento.");
        setIsPermissionError(false);
      }
    } finally {
      setIsDeletingDepartmentId(null);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    const confirmed = window.confirm(`Eliminar rol "${role.name}"?`);
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsPermissionError(false);
    setIsDeletingRoleId(role.id);

    try {
      await apiFetch(`/roles/${role.id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Rol eliminado correctamente.");
      if (selectedRoleId === role.id) {
        setSelectedRoleId(null);
        resetRoleForm();
      }
      await loadRolesByDepartment(selectedDepartmentId!);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403) {
        setErrorMessage("No tienes permisos para eliminar roles.");
        setIsPermissionError(true);
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        setIsPermissionError(false);
      } else {
        setErrorMessage("No se pudo eliminar el rol.");
        setIsPermissionError(false);
      }
    } finally {
      setIsDeletingRoleId(null);
    }
  };

  const handleSelectDepartment = (deptId: number) => {
    setSelectedDepartmentId(deptId);
    setSelectedRoleId(null);
    void loadRolesByDepartment(deptId);
    resetRoleForm();
  };

  return (
    <div className="min-h-screen bg-intra-ligth">
      <main className="flex min-h-screen w-full">
        <DashboardSidebar
          user={user ? { name: user.name, email: user.email } : null}
          isAdmin={isAdministrator(user)}
          isLeader={isLeader(user)}
          isNewHire={isNewHire(user)}
          activeRoute="departments"
          statusMessage={
            isLoadingDepartments
              ? "Cargando departamentos..."
              : errorMessage
                ? errorMessage
                : "Departamentos y roles sincronizados"
          }
        />

        <section className="min-w-0 flex-1 px-4 py-6 lg:px-6 xl:px-8 2xl:px-10">
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <header className="space-y-3">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                <ShieldCheck className="h-3 w-3" />
                Administracion
              </p>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                    Departamentos y Roles
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                    Crea y edita los departamentos de la organizacion, luego asigna roles especificos a cada uno.
                  </p>
                </div>
              </div>
            </header>

            {errorMessage ? (
              <div
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm shadow-sm",
                  isPermissionError
                    ? "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
                    : "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 text-[color:var(--danger)]",
                )}
              >
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 px-4 py-3 text-sm text-[color:var(--success)] shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                {successMessage}
              </div>
            ) : null}

            {canAccessDepartments ? (
              <div className="space-y-10">
                {/* ============== SECCION DEPARTAMENTOS ============== */}
                <section className="space-y-4">
                  <header className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                        Departamentos
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        {departments_sorted.length} {departments_sorted.length === 1 ? "departamento" : "departamentos"} registrados
                        {deptSearchTerm && filteredDepartments.length !== departments_sorted.length
                          ? ` · ${filteredDepartments.length} visibles`
                          : null}
                      </p>
                    </div>
                  </header>

                  <div
                    ref={deptFormSectionRef}
                    className="surface-card p-5 sm:p-6"
                  >
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">
                      {editingDepartmentId ? "Editar departamento" : "Nuevo departamento"}
                    </h4>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {editingDepartmentId
                        ? "Modifica el nombre o la descripcion."
                        : "Crea un nuevo departamento para la organizacion."}
                    </p>

                    <form onSubmit={handleSubmitDepartment} className="mt-5 space-y-4">
                      <Field
                        id="dept-name"
                        label="Nombre"
                        required
                        placeholder="Ej: Recursos Humanos"
                        value={deptFormState.name}
                        onChange={(value) => setDeptFormState({ ...deptFormState, name: value })}
                      />
                      <Field
                        id="dept-description"
                        label="Descripcion"
                        as="textarea"
                        rows={2}
                        placeholder="Descripcion opcional"
                        value={deptFormState.description}
                        onChange={(value) => setDeptFormState({ ...deptFormState, description: value })}
                      />

                      <div className="flex flex-wrap gap-2 pt-1">
                        <PrimaryButton type="submit" disabled={isSavingDepartment}>
                          {isSavingDepartment ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                            </>
                          ) : editingDepartmentId ? (
                            <>
                              <Edit2 className="h-4 w-4" /> Actualizar
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" /> Crear
                            </>
                          )}
                        </PrimaryButton>

                        {editingDepartmentId ? (
                          <SecondaryButton type="button" onClick={resetDeptForm}>
                            Cancelar
                          </SecondaryButton>
                        ) : null}
                      </div>
                    </form>
                  </div>

                  {isLoadingDepartments ? (
                    <SkeletonBlock />
                  ) : departments_sorted.length === 0 ? (
                    <EmptyState
                      icon={Building2}
                      title="Aun no hay departamentos"
                      body="Crea el primero con el formulario de arriba."
                    />
                  ) : (
                    <div className="surface-card overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
                        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                        <input
                          type="search"
                          value={deptSearchTerm}
                          onChange={(event) => setDeptSearchTerm(event.target.value)}
                          placeholder="Buscar departamento por nombre o descripcion..."
                          className="h-8 w-full border-0 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-soft)]"
                        />
                        <span className="shrink-0 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                          {filteredDepartments.length}/{departments_sorted.length}
                        </span>
                      </div>

                      {filteredDepartments.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-medium text-[var(--foreground)]">Sin coincidencias</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            No hay departamentos que coincidan con &ldquo;{deptSearchTerm}&rdquo;.
                          </p>
                        </div>
                      ) : (
                        <ul
                          className="max-h-[420px] divide-y divide-[var(--border)] overflow-y-auto"
                          aria-label="Lista de departamentos"
                        >
                          {filteredDepartments.map((dept) => {
                            const isSelected = selectedDepartmentId === dept.id;
                            return (
                              <li
                                key={dept.id}
                                className={cn(
                                  "group flex items-center gap-2 px-3 py-2 transition",
                                  isSelected
                                    ? "bg-[var(--primary-soft)]"
                                    : "hover:bg-[var(--surface-muted)]",
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleSelectDepartment(dept.id)}
                                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                                      isSelected
                                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                        : "border-[var(--border-strong)] bg-[var(--surface)]",
                                    )}
                                  >
                                    {isSelected ? (
                                      <Check className="h-3 w-3" strokeWidth={3} />
                                    ) : null}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={cn(
                                        "truncate text-sm font-medium",
                                        isSelected ? "text-[var(--primary)]" : "text-[var(--foreground)]",
                                      )}
                                    >
                                      {dept.name}
                                    </p>
                                    {dept.description ? (
                                      <p className="truncate text-xs text-[var(--muted)]">
                                        {dept.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </button>

                                <div className="flex shrink-0 items-center gap-1">
                                  <IconButton
                                    label="Editar departamento"
                                    onClick={() => handleEditDepartment(dept)}
                                    tone="primary"
                                    disabled={isSavingDepartment}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </IconButton>
                                  <IconButton
                                    label="Eliminar departamento"
                                    onClick={() => void handleDeleteDepartment(dept)}
                                    tone="danger"
                                    disabled={isDeletingDepartmentId === dept.id}
                                  >
                                    {isDeletingDepartmentId === dept.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </IconButton>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </section>

                {/* ============== SECCION ROLES ============== */}
                <section className="space-y-4">
                  <header className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Users className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                        Roles del departamento
                      </h3>
                      {selectedDepartment ? (
                        <p className="text-xs text-[var(--muted)]">
                          Gestionando: <span className="font-medium text-[var(--foreground)]">{selectedDepartment.name}</span>
                          {" · "}
                          {roles_sorted.length} {roles_sorted.length === 1 ? "rol" : "roles"}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--muted)]">
                          Selecciona un departamento para ver y editar sus roles.
                        </p>
                      )}
                    </div>
                    {selectedDepartmentId ? (
                      <button
                        type="button"
                        onClick={openCreateRoleModal}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] active:scale-[0.98]"
                      >
                        <Plus className="h-4 w-4" />
                        Nuevo rol
                      </button>
                    ) : null}
                  </header>

                  {!selectedDepartmentId ? (
                    <EmptyState
                      icon={Users}
                      title="Sin departamento seleccionado"
                      body="Haz clic en 'Ver roles' en cualquier departamento de arriba."
                    />
                  ) : isLoadingRoles ? (
                    <SkeletonBlock />
                  ) : roles_sorted.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Este departamento no tiene roles"
                      body="Usa el boton 'Nuevo rol' arriba para crear el primero."
                    />
                  ) : (
                    <div className="surface-card overflow-hidden">
                      <ul className="divide-y divide-[var(--border)]">
                        {roles_sorted.map((role) => (
                          <li
                            key={role.id}
                            className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-[var(--surface-muted)]"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                                <ShieldCheck className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                      {role.name}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                      {role.can_post_announcements
                                        ? "Puede publicar anuncios"
                                        : "Sin permisos de publicacion"}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                    role.can_post_announcements
                                      ? "bg-[color:var(--success)]/12 text-[color:var(--success)]"
                                      : "bg-[var(--surface-muted)] text-[var(--muted)]",
                                  )}
                                >
                                  <Megaphone className="h-3 w-3" />
                                  {role.can_post_announcements ? "publica" : "sin anuncios"}
                                </span>

                                <div className="flex items-center gap-2">
                                  <IconButton
                                    label="Editar rol"
                                    onClick={() => handleEditRole(role)}
                                    tone="primary"
                                    disabled={isSavingRole}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </IconButton>
                                  <IconButton
                                    label="Eliminar rol"
                                    onClick={() => void handleDeleteRole(role)}
                                    tone="danger"
                                    disabled={isDeletingRoleId === role.id}
                                  >
                                    {isDeletingRoleId === role.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </IconButton>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                </section>
              </div>
            ) : isLoadingUser ? (
              <div className="surface-card p-8 text-center text-sm text-[var(--muted)]">
                Validando permisos...
              </div>
            ) : (
              <div className="surface-card p-8 text-center text-sm text-[var(--muted)]">
                {errorMessage || "No tienes acceso a esta seccion."}
              </div>
            )}
          </div>
        </section>
      </main>

      <RoleFormModal
        open={isRoleModalOpen}
        onClose={closeRoleModal}
        editing={Boolean(editingRoleId)}
        departmentName={selectedDepartment?.name ?? ""}
        formState={roleFormState}
        onChange={setRoleFormState}
        onSubmit={handleSubmitRole}
        isSaving={isSavingRole}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Local UI helpers                                                    */
/* ------------------------------------------------------------------ */

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  as?: "input" | "textarea";
  rows?: number;
};

function Field({ id, label, value, onChange, placeholder, required, as = "input", rows }: FieldProps) {
  const sharedClasses =
    "mt-1 w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-soft)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] focus:outline-none rounded-lg";

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-[var(--foreground)]">
        {label}
        {required ? <span className="ml-0.5 text-[color:var(--danger)]">*</span> : null}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows ?? 2}
          className={sharedClasses}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={sharedClasses}
        />
      )}
    </div>
  );
}

type CheckboxFieldProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CheckboxField({ id, label, description, checked, onChange }: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 transition hover:border-[var(--primary)]"
    >
      <span className="relative inline-flex shrink-0 pt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "h-4 w-4 rounded border transition",
            checked
              ? "border-[var(--primary)] bg-[var(--primary)]"
              : "border-[var(--border-strong)] bg-[var(--surface)]",
          )}
        >
          <svg
            viewBox="0 0 16 16"
            className={cn(
              "absolute inset-0 m-auto h-3 w-3 text-white transition",
              checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
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
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--foreground)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[var(--muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--primary-glow)] transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  tone: "primary" | "danger";
  disabled?: boolean;
}) {
  const toneClasses =
    tone === "primary"
      ? "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
      : "border-[var(--border)] text-[var(--muted)] hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-[var(--surface)] transition active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60",
        toneClasses,
      )}
    >
      {children}
    </button>
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
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 px-4 py-8 text-center">
      <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{body}</p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="surface-card p-5">
      <div className="skeleton-shimmer h-4 w-1/3 rounded-md" />
      <div className="skeleton-shimmer mt-3 h-3 w-2/3 rounded-md" />
      <div className="skeleton-shimmer mt-5 h-9 w-full rounded-md" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

import { AnimatePresence, motion } from "framer-motion";
import { X as XIcon } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
};

function Modal({ open, onClose, title, description, icon: Icon, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                {Icon ? (
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                    {title}
                  </h3>
                  {description ? (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </header>
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Role form modal                                                     */
/* ------------------------------------------------------------------ */

type RoleFormModalProps = {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  departmentName: string;
  formState: RoleFormState;
  onChange: React.Dispatch<React.SetStateAction<RoleFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
};

function RoleFormModal({
  open,
  onClose,
  editing,
  departmentName,
  formState,
  onChange,
  onSubmit,
  isSaving,
}: RoleFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={ShieldCheck}
      title={editing ? "Editar rol" : "Nuevo rol"}
      description={
        editing
          ? "Modifica el nombre o el permiso de publicacion."
          : `Crea un rol dentro de ${departmentName || "este departamento"}.`
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          id="role-name"
          label="Nombre del rol"
          required
          placeholder="Ej: Jefe de Area"
          value={formState.name}
          onChange={(value) => onChange({ ...formState, name: value })}
        />

        <CheckboxField
          id="role-announcements"
          label="Puede publicar anuncios"
          description="Permite que los miembros con este rol creen publicaciones visibles."
          checked={formState.can_post_announcements}
          onChange={(checked) =>
            onChange({ ...formState, can_post_announcements: checked })
          }
        />

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
          <SecondaryButton type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : editing ? (
              <>
                <Edit2 className="h-4 w-4" /> Actualizar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Crear rol
              </>
            )}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
