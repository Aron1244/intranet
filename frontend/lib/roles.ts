export const ROLE_ADMINISTRADOR = "Administrador";
export const ROLE_LIDER = "Líder";
export const ROLE_COLABORADOR = "Colaborador";
export const ROLE_NUEVO_INGRESO = "Nuevo Ingreso";

export const ROLE_ADMIN_LEGACY_ALIASES = ["admin", "Admin", "administrador", "ADMIN"];

export type UserRole = {
  id: number;
  name: string;
  can_manage_department?: boolean;
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

function hasAnyRole(user: RoleAwareUser, roleNames: readonly string[]): boolean {
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }

  return user.roles.some(
    (role) => role?.name != null && roleNames.includes(role.name),
  );
}

export function isAdministrator(user: RoleAwareUser): boolean {
  return hasRole(user, ROLE_ADMINISTRADOR) || hasAnyRole(user, ROLE_ADMIN_LEGACY_ALIASES);
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

/**
 * True when the user holds any role with the can_manage_department flag.
 * This is what marks a department leader regardless of the role name.
 */
export function isDepartmentLeader(user: RoleAwareUser): boolean {
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }

  return user.roles.some((role) => role?.can_manage_department === true);
}

/**
 * True when the user can moderate (soft-delete) messages/documents of
 * department chats. Admins or any department leader are allowed.
 */
export function canModerateDepartment(user: RoleAwareUser): boolean {
  if (isAdministrator(user)) {
    return true;
  }

  return isDepartmentLeader(user);
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