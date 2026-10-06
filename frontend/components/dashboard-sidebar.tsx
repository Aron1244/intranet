"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { clearAccessToken } from "@/lib/auth-token";

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

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  visible: (state: SidebarState) => boolean;
};

type SidebarState = {
  isAdmin: boolean;
  isLeader: boolean;
  isNewHire: boolean;
  canManageAnnouncements: boolean;
};

const NAV_ITEMS: NavItem[] = [
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

  const visibleItems = NAV_ITEMS.filter((item) => item.visible(state));
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
      <div className="flex items-center justify-between px-5 py-5">
        <BrandMark />
        <span
          aria-hidden="true"
          className="inline-flex h-6 items-center rounded-full bg-[var(--primary-soft)] px-2 text-[10px] font-semibold tracking-wide text-[var(--primary)] uppercase"
        >
          v3
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
          Navegacion
        </p>

        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = item.key === activeKey;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--primary)]"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-4 w-4 transition",
                      isActive
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.key === "conversations" ? (
                    <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                      live
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-sm font-semibold text-white">
            {initials}
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]"
            />
          </div>
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
            onClick={handleLogout}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
            aria-label="Cerrar sesion"
          >
            Salir
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] pulse-dot" />
            {statusMessage ?? "Sesion activa"}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}