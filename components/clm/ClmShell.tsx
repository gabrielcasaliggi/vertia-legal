"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppNav } from "@/components/clm/AppNav";
import { DemoHelpPanel } from "@/components/clm/DemoHelpPanel";
import type { UserProfile } from "@/lib/auth/session";

export function ClmShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <>
      <AppNav profile={profile} onOpenHelp={() => setHelpOpen(true)} />
      {children}
      <DemoHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
