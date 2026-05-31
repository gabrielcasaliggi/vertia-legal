import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { UserOrganization } from "@/lib/auth/organization";

export const ACTIVE_ORG_COOKIE = "vertia_active_org";

export interface OrganizationMembership extends UserOrganization {
  member_role: "owner" | "admin" | "member";
  org_status: string;
}

export async function listUserOrganizations(): Promise<OrganizationMembership[]> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", profile.id)
    .eq("is_active", true);

  if (membersError || !members || members.length === 0) {
    return [];
  }

  const orgIds = members.map((member) => member.organization_id);
  const { data: organizations, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, slug, status")
    .in("id", orgIds);

  if (orgsError || !organizations) {
    return [];
  }

  const orgById = new Map(organizations.map((org) => [org.id, org]));

  return members
    .map((member) => {
      const org = orgById.get(member.organization_id);
      if (!org) {
        return null;
      }
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        member_role: member.role as OrganizationMembership["member_role"],
        org_status: org.status,
      };
    })
    .filter((item): item is OrganizationMembership => item !== null);
}

export async function getActiveOrganizationIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_ORG_COOKIE)?.value?.trim();
  return value || null;
}

export async function resolveActiveOrganizationId(): Promise<string | null> {
  const memberships = await listUserOrganizations();
  if (memberships.length === 0) {
    return null;
  }

  const cookieOrgId = await getActiveOrganizationIdFromCookie();
  if (cookieOrgId && memberships.some((m) => m.id === cookieOrgId)) {
    return cookieOrgId;
  }

  if (memberships.length === 1) {
    return memberships[0].id;
  }

  return null;
}

export async function requireActiveOrganizationId(): Promise<string> {
  const orgId = await resolveActiveOrganizationId();
  if (!orgId) {
    throw new Error("Seleccioná una organización activa.");
  }

  const memberships = await listUserOrganizations();
  const membership = memberships.find((m) => m.id === orgId);
  if (!membership) {
    throw new Error("No tenés acceso a la organización activa.");
  }

  if (membership.org_status === "suspended" || membership.org_status === "cancelled") {
    throw new Error(
      "La organización está suspendida o cancelada. Contactá a Vertia Legal para reactivar el acceso.",
    );
  }

  return orgId;
}

export async function getActiveOrganization(): Promise<OrganizationMembership | null> {
  const orgId = await resolveActiveOrganizationId();
  if (!orgId) {
    return null;
  }

  const memberships = await listUserOrganizations();
  return memberships.find((m) => m.id === orgId) ?? null;
}
