export const ROLE_ADMINISTRADOR = "Administrador";
export const ROLE_LIDER = "Líder";
export const ROLE_COLABORADOR = "Colaborador";
export const ROLE_NUEVO_INGRESO = "Nuevo Ingreso";

export const ROLE_ADMIN_LEGACY_ALIAS = "admin";

export type UserRole = {
  id: number;
  name: string;
};

export type RoleAwareUser = {
  roles?: UserRole[] | null;
  onboarding_pendiente?: boolean | null;
} | null | undefined;

function hasRole(user: RoleAwareUser, roleName: string): boolean {
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }

  return user.roles.some((role) => role?.name === roleName);
}

export function isAdministrator(user: RoleAwareUser): boolean {
  return hasRole(user, ROLE_ADMINISTRADOR) || hasRole(user, ROLE_ADMIN_LEGACY_ALIAS);
}

export function isLeader(user: RoleAwareUser): boolean {
  return hasRole(user, ROLE_LIDER);
}

export function isCollaborator(user: RoleAwareUser): boolean {
  if (!isAdministrator(user) && !isLeader(user)) {
    return true;
  }

  return false;
}

export function isNewHire(user: RoleAwareUser): boolean {
  if (!user) {
    return false;
  }

  if (hasRole(user, ROLE_NUEVO_INGRESO)) {
    return true;
  }

  return Boolean(user.onboarding_pendiente);
}