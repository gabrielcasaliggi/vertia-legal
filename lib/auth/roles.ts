export type UserRole = "admin" | "lawyer" | "accountant" | "assistant";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  lawyer: "Abogado/a",
  accountant: "Contador/a",
  assistant: "Asistente",
};

export function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "lawyer" || value === "accountant" || value === "assistant";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
