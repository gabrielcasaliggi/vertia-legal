"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppNav({
  onOpenHelp,
  profile,
  isPlatformAdmin = false,
  activeOrganization = null,
  organizations = [],
}: AppNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const showAdmin = profile && canManageUsers(profile.role);
  const adminActive = pathname.startsWith("/admin");
  const platformActive = pathname.startsWith("/platform");

  useEffect(() => {
    setMobileOpen(false);
    setConfigOpen(false);
  }, [pathname]);

  function closeMenus() {
    setMobileOpen(false);
    setConfigOpen(false);
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="mr-1 shrink-0">
            <BrandMark />
          </div>

          {activeOrganization ? (
            <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100 md:inline-flex">
              {activeOrganization.name}
            </span>
          ) : null}

          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={item.match(pathname)}
              />
            ))}

            {showAdmin || isPlatformAdmin ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setConfigOpen((value) => !value)}
                  aria-expanded={configOpen}
                  className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
                    adminActive || platformActive
                      ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Configuración
                </button>
                {configOpen ? (
                  <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-corp border border-slate-700 bg-slate-900 p-2 shadow-xl">
                    {showAdmin ? (
                      <>
                        <Link
                          href="/admin/usuarios"
                          className="block rounded-corp px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Mi estudio · Usuarios
                        </Link>
                        <Link
                          href="/admin/organizacion"
                          className="block rounded-corp px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Mi estudio · Configuración
                        </Link>
                      </>
                    ) : null}
                    {isPlatformAdmin ? (
                      <Link
                        href="/platform/organizaciones"
                        className="block rounded-corp px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                      >
                        Plataforma SaaS
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHelp}
            className="hidden rounded-corp border border-slate-700 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-100 sm:inline-flex"
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
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            className="rounded-corp border border-slate-700 px-3 py-2 text-sm text-slate-200 lg:hidden"
          >
            Menú
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-800 bg-slate-950 px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={item.match(pathname)}
                onNavigate={closeMenus}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                closeMenus();
                onOpenHelp();
              }}
              className="rounded-corp px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Ayuda
            </button>
            {showAdmin ? (
              <>
                <Link
                  href="/admin/usuarios"
                  onClick={closeMenus}
                  className="rounded-corp px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  Mi estudio · Usuarios
                </Link>
                <Link
                  href="/admin/organizacion"
                  onClick={closeMenus}
                  className="rounded-corp px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  Mi estudio · Configuración
                </Link>
              </>
            ) : null}
            {isPlatformAdmin ? (
              <Link
                href="/platform/organizaciones"
                onClick={closeMenus}
                className="rounded-corp px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Plataforma SaaS
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
