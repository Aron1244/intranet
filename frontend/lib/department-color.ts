/**
 * Color de identificacion visual para un departamento.
 *
 * El color vive en la base de datos (`departments.color`) y lo asigna un
 * administrador. Los departamentos que todavia no tienen color propio usan
 * uno de esta paleta, derivado de su id: es deterministico, asi que el mismo
 * departamento muestra siempre el mismo circulo, y los departamentos existentes
 * se distinguen entre si sin necesidad de intervencion manual.
 */

/**
 * Paleta por defecto. Tonos Tailwind 600: legibles sobre fondo claro y sobre
 * fondo oscuro, y distinguibles entre si en la mayoria de combinaciones. Son
 * doce para que una organizacion con hasta doce departamentos vea un color
 * distinto en cada uno sin intervencion manual.
 */
export const DEFAULT_DEPARTMENT_COLORS = [
  "#2563eb",
  "#059669",
  "#db2777",
  "#d97706",
  "#0891b2",
  "#7c3aed",
  "#65a30d",
  "#dc2626",
  "#0d9488",
  "#c026d3",
  "#ea580c",
  "#4f46e5",
] as const;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Devuelve true si el valor es un color hexadecimal de la forma #RRGGBB.
 */
export function isValidHexColor(value?: string | null): boolean {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value.trim());
}

/**
 * Resuelve el color a mostrar para un departamento: el que tenga asignado o,
 * si no tiene, uno de la paleta por defecto segun su id.
 */
export function resolveDepartmentColor(department: {
  id: number;
  color?: string | null;
}): string {
  if (isValidHexColor(department.color)) {
    return department.color!.trim();
  }

  const index = Math.abs(department.id) % DEFAULT_DEPARTMENT_COLORS.length;
  return DEFAULT_DEPARTMENT_COLORS[index];
}
