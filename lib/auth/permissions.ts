import type { UserRole } from "@/lib/auth/roles";

export type Permission =
  | "manage_users"
  | "manage_organization"
  | "upload_contracts"
  | "edit_contract_metadata"
  | "archive_contracts"
  | "replace_contract_pdf"
  | "reindex_contract"
  | "run_audit"
  | "run_assisted_query"
  | "manage_clients"
  | "manage_tasks"
  | "export_reports"
  | "send_notification_digest";

const ALL_PERMISSIONS: Permission[] = [
  "manage_users",
  "manage_organization",
  "upload_contracts",
  "edit_contract_metadata",
  "archive_contracts",
  "replace_contract_pdf",
  "reindex_contract",
  "run_audit",
  "run_assisted_query",
  "manage_clients",
  "manage_tasks",
  "export_reports",
  "send_notification_digest",
];

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set(ALL_PERMISSIONS),
  lawyer: new Set([
    "upload_contracts",
    "edit_contract_metadata",
    "archive_contracts",
    "replace_contract_pdf",
    "reindex_contract",
    "run_audit",
    "run_assisted_query",
    "manage_clients",
    "manage_tasks",
    "export_reports",
  ]),
  accountant: new Set([
    "run_assisted_query",
    "manage_tasks",
    "export_reports",
  ]),
  assistant: new Set(["upload_contracts", "manage_tasks"]),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function permissionDeniedMessage(permission: Permission): string {
  return `No tenés permiso para esta acción (${permission}).`;
}
