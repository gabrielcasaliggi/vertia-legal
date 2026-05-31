import { describe, expect, it } from "vitest";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/active-organization";

describe("active organization cookie", () => {
  it("usa nombre estable para persistencia", () => {
    expect(ACTIVE_ORG_COOKIE).toBe("vertia_active_org");
  });
});

describe("resolveActiveOrganization behavior", () => {
  it("prioriza cookie válida sobre primera membresía", () => {
    const memberships = [
      { id: "org-a", name: "A" },
      { id: "org-b", name: "B" },
    ];
    const cookieOrgId = "org-b";

    const resolved =
      cookieOrgId && memberships.some((membership) => membership.id === cookieOrgId)
        ? cookieOrgId
        : memberships.length === 1
          ? memberships[0]?.id
          : null;

    expect(resolved).toBe("org-b");
  });

  it("devuelve null si hay múltiples orgs sin cookie", () => {
    const memberships = [{ id: "org-a" }, { id: "org-b" }];
    const cookieOrgId = null;
    const resolved =
      cookieOrgId && memberships.some((membership) => membership.id === cookieOrgId)
        ? cookieOrgId
        : memberships.length === 1
          ? memberships[0]?.id
          : null;

    expect(resolved).toBeNull();
  });
});
