import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/permissions";

describe("hasPermission", () => {
  it("admin tiene todos los permisos clave", () => {
    expect(hasPermission("admin", "manage_users")).toBe(true);
    expect(hasPermission("admin", "export_reports")).toBe(true);
    expect(hasPermission("admin", "run_audit")).toBe(true);
  });

  it("lawyer puede operar contratos pero no admin", () => {
    expect(hasPermission("lawyer", "upload_contracts")).toBe(true);
    expect(hasPermission("lawyer", "run_audit")).toBe(true);
    expect(hasPermission("lawyer", "manage_users")).toBe(false);
  });

  it("accountant exporta y consulta, sin subir PDFs", () => {
    expect(hasPermission("accountant", "export_reports")).toBe(true);
    expect(hasPermission("accountant", "run_assisted_query")).toBe(true);
    expect(hasPermission("accountant", "upload_contracts")).toBe(false);
  });

  it("assistant solo carga y gestiona tareas", () => {
    expect(hasPermission("assistant", "upload_contracts")).toBe(true);
    expect(hasPermission("assistant", "manage_tasks")).toBe(true);
    expect(hasPermission("assistant", "run_audit")).toBe(false);
  });
});
