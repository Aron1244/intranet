let isMobileNavOpen = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openMobileNav(): void {
  isMobileNavOpen = true;
  emit();
}

export function closeMobileNav(): void {
  isMobileNavOpen = false;
  emit();
}

export function toggleMobileNav(): void {
  isMobileNavOpen = !isMobileNavOpen;
  emit();
}

export function getMobileNavOpen(): boolean {
  return isMobileNavOpen;
}