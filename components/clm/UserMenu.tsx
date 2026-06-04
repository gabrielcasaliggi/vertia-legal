"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrganizationMembership } from "@/lib/auth/active-organization";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface UserMenuProps {
  fullName: string;
  email: string;
  role: UserRole;
  isPlatformAdmin?: boolean;
  activeOrganization?: OrganizationMembership | null;
  organizations?: OrganizationMembership[];
}

export function UserMenu({
  fullName,
  email,
  role,
  isPlatformAdmin = false,
  activeOrganization = null,
  organizations = [],
}: UserMenuProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const displayName = fullName.trim() || email.split("@")[0];
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VL";

  async function handleLogout() {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setLoading(false);
  }

  async function handleSwitchOrganization(organizationId: string) {
    setSwitchingOrgId(organizationId);
    try {
      const response = await fetch("/api/auth/active-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organizationId }),
      });
      if (!response.ok) {
        return;
      }
      setOrgMenuOpen(false);
      router.refresh();
    } finally {
      setSwitchingOrgId(null);
    }
  }

  return (
    <div className="relative flex items-center gap-2 rounded-corp border border-slate-700 bg-slate-900/75 px-2 py-1.5 shadow-inner shadow-white/5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/15 text-xs font-semibold text-cyan-100">
        {initials}
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="max-w-[150px] truncate text-sm font-medium leading-tight text-slate-100">
          {displayName}
        </p>
        <p className="text-[11px] leading-tight text-slate-400">
          {isPlatformAdmin ? "Vertia · Plataforma" : USER_ROLE_LABELS[role]}
        </p>
      </div>
      {organizations.length > 1 ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOrgMenuOpen((value) => !value)}
            aria-expanded={orgMenuOpen}
            aria-label="Cambiar organización"
            disabled={Boolean(switchingOrgId)}
            className="max-w-[140px] truncate rounded-corp border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 hover:border-cyan-400/40"
          >
            {activeOrganization?.name ?? "Organización"}
          </button>
          {orgMenuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-corp border border-slate-700 bg-slate-900 p-2 shadow-xl">
              {organizations.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => void handleSwitchOrganization(organization.id)}
                  disabled={switchingOrgId === organization.id}
                  className={`block w-full rounded-corp px-3 py-2 text-left text-xs ${
                    organization.id === activeOrganization?.id
                      ? "bg-cyan-500/15 text-cyan-100"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {organization.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loading}
        className="rounded-corp px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
      >
        {loading ? "…" : "Salir"}
      </button>
    </div>
  );
}
