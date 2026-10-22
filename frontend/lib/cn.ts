type ClassValue = string | number | false | null | undefined | Record<string, boolean | null | undefined> | ClassValue[];

function flatten(value: ClassValue): string[] {
  if (!value && value !== 0) {
    return [];
  }

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flatten);
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([key]) => key);
  }

  return [];
}

export function cn(...values: ClassValue[]): string {
  return values.flatMap(flatten).filter(Boolean).join(" ");
}