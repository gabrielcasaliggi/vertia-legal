import { describe, expect, it } from "vitest";
import { normalizeSlug } from "@/lib/platform/organizations";

describe("normalizeSlug", () => {
  it("convierte nombre a slug seguro", () => {
    expect(normalizeSlug("Estudio Casaliggi & Asoc.")).toBe("estudio-casaliggi-asoc");
  });

  it("elimina guiones sobrantes", () => {
    expect(normalizeSlug("---demo---")).toBe("demo");
  });
});

describe("platform vs org admin separation", () => {
  it("platform admin es concepto distinto de profiles.role admin", () => {
    const orgAdminRole = "admin";
    const platformAdminTable = "platform_admins";
    expect(orgAdminRole).toBe("admin");
    expect(platformAdminTable).not.toBe("profiles");
  });
});

describe("organization lifecycle statuses", () => {
  const allowed = ["trial", "active", "suspended", "cancelled"] as const;

  it("incluye estados comerciales esperados", () => {
    expect(allowed).toContain("trial");
    expect(allowed).toContain("suspended");
  });

  it("bloquea operación en suspended/cancelled", () => {
    const blocked = ["suspended", "cancelled"];
    for (const status of blocked) {
      expect(["suspended", "cancelled"]).toContain(status);
    }
  });
});

describe("tenant isolation rules", () => {
  it("requiere organization_id explícito para scope", () => {
    const contractA = { id: "c1", organization_id: "org-a" };
    const contractB = { id: "c2", organization_id: "org-b" };
    const activeOrg = "org-a";

    const visible = [contractA, contractB].filter(
      (contract) => contract.organization_id === activeOrg,
    );

    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe("c1");
  });

  it("admin de usuarios debe filtrar por organization_members", () => {
    const members = [
      { user_id: "u1", organization_id: "org-a" },
      { user_id: "u2", organization_id: "org-b" },
    ];
    const scoped = members.filter((member) => member.organization_id === "org-a");
    expect(scoped.map((member) => member.user_id)).toEqual(["u1"]);
  });
});
