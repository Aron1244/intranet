"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutGrid,
  LogOut,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { clearAccessToken } from "@/lib/auth-token";
import { useMobileNav } from "@/lib/use-mobile-nav";

type SidebarUser = {
  name: string;
  email: string;
} | null;

type SidebarProps = {
  user: SidebarUser;
  isAdmin: boolean;
  isLeader: boolean;
  isNewHire: boolean;
  canManageAnnouncements?: boolean;
  activeRoute?: string;
  statusMessage?: string;
};

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  visible: (state: SidebarState) => boolean;
};

export type SidebarState = {
  isAdmin: boolean;
  isLeader: boolean;
  isNewHire: boolean;
  canManageAnnouncements: boolean;
};

/**
 * Catalogo de navegacion por rol. Se exporta para que el resumen pueda listar
 * los modulos visibles sin duplicar estas reglas de acceso.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Resumen",
    href: "/dashboard",
    icon: LayoutGrid,
    visible: () => true,
  },
  {
    key: "conversations",
    label: "Conversaciones",
    href: "/dashboard/conversations",
    icon: MessageSquare,
    visible: () => true,
  },
  {
    key: "publications",
    label: "Publicaciones",
    href: "/dashboard/publications",
    icon: Megaphone,
    visible: () => true,
  },
  {
    key: "documents",
    label: "Documentos",
    href: "/dashboard/documents",
    icon: FileText,
    visible: () => true,
  },
  {
    key: "tasks",
    label: "Tareas",
    href: "/dashboard/tasks",
    icon: BarChart3,
    visible: () => true,
  },
  {
    key: "departments",
    label: "Departamentos",
    href: "/dashboard/departments",
    icon: Building2,
    visible: (state) => state.isAdmin,
  },
  {
    key: "users",
    label: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    visible: (state) => state.isAdmin,
  },
  {
    key: "trash",
    label: "Papelera",
    href: "/dashboard/trash",
    icon: ShieldAlert,
    visible: (state) => state.isAdmin,
  },
  {
    key: "leader",
    label: "Equipo",
    href: "/dashboard/conversations",
    icon: UsersRound,
    visible: (state) => state.isLeader && !state.isAdmin,
  },
];

/** Modulos que el usuario puede ver segun su rol y permisos. */
export function visibleNavItems(state: SidebarState): NavItem[] {
  return NAV_ITEMS.filter((item) => item.visible(state));
}

export function DashboardSidebar({
  user,
  isAdmin,
  isLeader,
  isNewHire,
  canManageAnnouncements,
  activeRoute,
  statusMessage,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const state: SidebarState = {
    isAdmin,
    isLeader,
    isNewHire,
    canManageAnnouncements: canManageAnnouncements ?? false,
  };

  const visibleItems = visibleNavItems(state);
  const initials = (user?.name ?? "Invitado")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IN";

  const activeKey =
    activeRoute ??
    visibleItems.find((item) => pathname === item.href)?.key ??
    "dashboard";

  const handleLogout = () => {
    clearAccessToken();
    router.push("/");
  };

  return (
    <aside className="sticky top-0 z-30 hidden h-[100dvh] w-[260px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md lg:flex lg:flex-col">
      <div className="flex items-center px-5 py-5">
        <BrandMark />
      </div>

      <nav
        aria-label="Navegacion principal"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1"
      >
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
          Navegacion
        </p>

        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink key={item.key} item={item} isActive={item.key === activeKey} />
          ))}
        </ul>
      </nav>

      <SidebarFooter
        user={user}
        initials={initials}
        statusMessage={statusMessage}
        onLogout={handleLogout}
      />
    </aside>
  );
}

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition",
          isActive
            ? "bg-[var(--primary-soft)] text-[var(--primary)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    </li>
  );
}

/**
 * Pie de la barra. `min-w-0` + `truncate` son obligatorios: el mensaje de
 * estado puede traer textos largos (por ejemplo "No autenticado. Inicia sesion
 * nuevamente.") y sin esto desbordaba fuera de la barra.
 */
function SidebarFooter({
  user,
  initials,
  statusMessage,
  onLogout,
}: {
  user: SidebarUser;
  initials: string;
  statusMessage?: string;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-[var(--border)] px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-sm font-semibold text-white">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {user?.name ?? "Invitado"}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">
            {user?.email ?? "Sin sesion"}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
          aria-label="Cerrar sesion"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--muted)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted-soft)]" />
          <span className="truncate">{statusMessage ?? "Sesion activa"}</span>
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
}

/**
 * Drawer de navegacion para `< lg`. Reusa exactamente el mismo catalogo y las
 * mismas reglas de rol que la barra de escritorio, asi ambos nunca divergen.
 */
export function MobileNavDrawer({
  user,
  isAdmin,
  isLeader,
  isNewHire,
  canManageAnnouncements,
  activeRoute,
  statusMessage,
}: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useMobileNav();

  const visibleItems = visibleNavItems({
    isAdmin,
    isLeader,
    isNewHire,
    canManageAnnouncements: canManageAnnouncements ?? false,
  });

  const initials = (user?.name ?? "Invitado")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IN";

  const activeKey =
    activeRoute ??
    visibleItems.find((item) => pathname === item.href)?.key ??
    "dashboard";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar navegacion"
        onClick={close}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navegacion"
        className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)]"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <BrandMark />
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar navegacion"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          aria-label="Navegacion principal"
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1"
        >
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            Navegacion
          </p>
          <ul className="space-y-1">
            {visibleItems.map((item) => (
              <NavLink
                key={item.key}
                item={item}
                isActive={item.key === activeKey}
                onNavigate={close}
              />
            ))}
          </ul>
        </nav>

        <SidebarFooter
          user={user}
          initials={initials}
          statusMessage={statusMessage}
          onLogout={() => {
            clearAccessToken();
            close();
            window.location.href = "/";
          }}
        />
      </div>
    </div>
  );
}