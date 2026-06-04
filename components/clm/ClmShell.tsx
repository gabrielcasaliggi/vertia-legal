"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppNav } from "@/components/clm/AppNav";
import { DemoHelpPanel } from "@/components/clm/DemoHelpPanel";
import { UserProfileProvider } from "@/components/clm/UserProfileContext";
import type { OrganizationMembership } from "@/lib/auth/active-organization";
import type { UserProfile } from "@/lib/auth/session";

export function ClmShell({
  children,
  profile,
  isPlatformAdmin = false,
  activeOrganization = null,
  organizations = [],
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
  isPlatformAdmin?: boolean;
  activeOrganization?: OrganizationMembership | null;
  organizations?: OrganizationMembership[];
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <UserProfileProvider role={profile?.role ?? null}>
      <AppNav
        profile={profile}
        onOpenHelp={() => setHelpOpen(true)}
        isPlatformAdmin={isPlatformAdmin}
        activeOrganization={activeOrganization}
        organizations={organizations}
      />
      {children}
      <DemoHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </UserProfileProvider>
  );
}
