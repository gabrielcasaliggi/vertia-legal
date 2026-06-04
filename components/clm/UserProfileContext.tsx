"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/roles";
import { canManageUsers } from "@/lib/auth/roles";

interface UserProfileContextValue {
  role: UserRole | null;
  can: (permission: Permission) => boolean;
  canManageUsers: boolean;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  role: null,
  can: () => false,
  canManageUsers: false,
});

export function UserProfileProvider({
  role,
  children,
}: {
  role: UserRole | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      role,
      can: (permission: Permission) => (role ? hasPermission(role, permission) : false),
      canManageUsers: role ? canManageUsers(role) : false,
    }),
    [role],
  );

  return (
    <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
