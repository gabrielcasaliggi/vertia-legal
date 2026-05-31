"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/clm/BrandMark";
import { UserMenu } from "@/components/clm/UserMenu";
import type { OrganizationMembership } from "@/lib/auth/active-organization";
import type { UserProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", match: (path: string) => path === "/" },
  { href: "/clients", label: "Clientes", match: (path: string) => path.startsWith("/clients") },
  {
    href: "/contracts",
    label: "Documentos",
    match: (path: string) => path.startsWith("/contracts"),
  },
  { href: "/tareas", label: "Tareas", match: (path: string) => path === "/tareas" },
  { href: "/reportes", label: "Reportes", match: (path: string) => path === "/reportes" },
] as const;

interface AppNavProps {
  onOpenHelp: () => void;
  profile: UserProfile | null;
  isPlatformAdmin?: boolean;
  activeOrganization?: OrganizationMembership | null;
  organizations?: OrganizationMembership[];
}

export function AppNav({
  onOpenHelp,
  profile,
  isPlatformAdmin = false,
  activeOrganization = null,
  organizations = [],
}: AppNavProps) {
  const pathname = usePathname();
  const showAdmin = profile && canManageUsers(profile.role);
  const adminActive = pathname.startsWith("/admin");
  const platformActive = pathname.startsWith("/platform");

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2">
            <BrandMark />
          </div>

          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {showAdmin ? (
            <div className="flex items-center gap-1 rounded-corp border border-slate-800 bg-slate-900/60 p-1">
              <Link
                href="/admin/usuarios"
                className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
                  adminActive && pathname.startsWith("/admin/usuarios")
                    ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                Mi estudio · Usuarios
              </Link>
              <Link
                href="/admin/organizacion"
                className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
                  adminActive && pathname.startsWith("/admin/organizacion")
                    ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                Mi estudio · Configuración
              </Link>
            </div>
          ) : null}

          {isPlatformAdmin ? (
            <Link
              href="/platform/organizaciones"
              className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
                platformActive
                  ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Plataforma SaaS
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHelp}
            className="rounded-corp border border-slate-700 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            Ayuda
          </button>
          {profile ? (
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              role={profile.role}
              isPlatformAdmin={isPlatformAdmin}
              activeOrganization={activeOrganization}
              organizations={organizations}
            />
          ) : null}
        </div>
      </div>
    </nav>
  );
}
