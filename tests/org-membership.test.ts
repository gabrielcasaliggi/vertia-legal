import { describe, expect, it } from "vitest";
import { mapProfileRoleToOrgMemberRole } from "@/lib/auth/org-membership";

describe("mapProfileRoleToOrgMemberRole", () => {
  it("asigna owner a perfiles admin", () => {
    expect(mapProfileRoleToOrgMemberRole("admin")).toBe("owner");
  });

  it("asigna member a roles no administrativos", () => {
    expect(mapProfileRoleToOrgMemberRole("lawyer")).toBe("member");
    expect(mapProfileRoleToOrgMemberRole("accountant")).toBe("member");
    expect(mapProfileRoleToOrgMemberRole("assistant")).toBe("member");
  });
});
