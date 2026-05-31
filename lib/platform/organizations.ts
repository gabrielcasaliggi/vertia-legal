import { syncOrganizationMembership } from "@/lib/auth/org-membership";
import { logPlatformAction } from "@/lib/platform/audit-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

export type OrganizationStatus = "trial" | "active" | "suspended" | "cancelled";
export type OrganizationPlan = "pilot" | "professional" | "enterprise";

export interface PlatformOrganizationMetrics {
  users: number;
  contracts: number;
  tasks: number;
  last_activity_at: string | null;
}

export interface PlatformOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  plan: OrganizationPlan;
  billing_email: string | null;
  trial_ends_at: string | null;
  suspended_at: string | null;
  created_at: string;
  metrics: PlatformOrganizationMetrics;
}

export interface CreatePlatformOrganizationInput {
  name: string;
  slug: string;
  plan?: OrganizationPlan;
  status?: OrganizationStatus;
  billing_email?: string | null;
  trial_ends_at?: string | null;
}

export interface UpdatePlatformOrganizationInput {
  name?: string;
  status?: OrganizationStatus;
  plan?: OrganizationPlan;
  billing_email?: string | null;
  trial_ends_at?: string | null;
}

export interface CreateOrganizationOwnerInput {
  email: string;
  password: string;
  full_name: string;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchOrganizationMetrics(
  organizationId: string,
): Promise<PlatformOrganizationMetrics> {
  const supabase = createServerSupabaseClient();

  const [usersRes, contractsRes, tasksRes, activityRes] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("legal_contracts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("contract_tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("legal_contracts")
      .select("created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  return {
    users: usersRes.count ?? 0,
    contracts: contractsRes.count ?? 0,
    tasks: tasksRes.count ?? 0,
    last_activity_at: activityRes.data?.[0]?.created_at ?? null,
  };
}

export async function listPlatformOrganizations(): Promise<PlatformOrganizationSummary[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, status, plan, billing_email, trial_ends_at, suspended_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudieron listar organizaciones.");
  }

  const summaries = await Promise.all(
    data.map(async (org) => ({
      ...org,
      status: org.status as OrganizationStatus,
      plan: org.plan as OrganizationPlan,
      metrics: await fetchOrganizationMetrics(org.id),
    })),
  );

  return summaries;
}

export async function getPlatformOrganization(
  organizationId: string,
): Promise<PlatformOrganizationSummary | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, status, plan, billing_email, trial_ends_at, suspended_at, created_at",
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    status: data.status as OrganizationStatus,
    plan: data.plan as OrganizationPlan,
    metrics: await fetchOrganizationMetrics(data.id),
  };
}

export async function createPlatformOrganization(
  actor: { id: string; email: string },
  input: CreatePlatformOrganizationInput,
): Promise<PlatformOrganizationSummary> {
  const supabase = createServerSupabaseClient();
  const slug = normalizeSlug(input.slug || input.name);

  if (!slug) {
    throw new Error("El slug de la organización es inválido.");
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name.trim(),
      slug,
      plan: input.plan ?? "pilot",
      status: input.status ?? "trial",
      billing_email: input.billing_email?.trim() || null,
      trial_ends_at: input.trial_ends_at ?? null,
      created_by_platform_admin_id: actor.id,
    })
    .select(
      "id, name, slug, status, plan, billing_email, trial_ends_at, suspended_at, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la organización.");
  }

  await logPlatformAction({
    actorUserId: actor.id,
    actorEmail: actor.email,
    action: "organization.created",
    entityType: "organization",
    entityId: data.id,
    entityLabel: data.name,
    metadata: { slug: data.slug, plan: data.plan, status: data.status },
  });

  return {
    ...data,
    status: data.status as OrganizationStatus,
    plan: data.plan as OrganizationPlan,
    metrics: await fetchOrganizationMetrics(data.id),
  };
}

export async function updatePlatformOrganization(
  actor: { id: string; email: string },
  organizationId: string,
  input: UpdatePlatformOrganizationInput,
): Promise<PlatformOrganizationSummary> {
  const supabase = createServerSupabaseClient();
  const existing = await getPlatformOrganization(organizationId);
  if (!existing) {
    throw new Error("Organización no encontrada.");
  }

  const payload: OrganizationUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }
  if (input.plan !== undefined) {
    payload.plan = input.plan;
  }
  if (input.billing_email !== undefined) {
    payload.billing_email = input.billing_email?.trim() || null;
  }
  if (input.trial_ends_at !== undefined) {
    payload.trial_ends_at = input.trial_ends_at;
  }
  if (input.status !== undefined) {
    payload.status = input.status;
    if (input.status === "suspended") {
      payload.suspended_at = new Date().toISOString();
    } else if (input.status === "active" || input.status === "trial") {
      payload.suspended_at = null;
    }
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", organizationId)
    .select(
      "id, name, slug, status, plan, billing_email, trial_ends_at, suspended_at, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar la organización.");
  }

  const action =
    input.status === "suspended"
      ? "organization.suspended"
      : existing.status === "suspended" && input.status === "active"
        ? "organization.reactivated"
        : "organization.updated";

  await logPlatformAction({
    actorUserId: actor.id,
    actorEmail: actor.email,
    action,
    entityType: "organization",
    entityId: data.id,
    entityLabel: data.name,
    metadata: { before: existing.status, after: data.status, plan: data.plan },
  });

  return {
    ...data,
    status: data.status as OrganizationStatus,
    plan: data.plan as OrganizationPlan,
    metrics: await fetchOrganizationMetrics(data.id),
  };
}

export async function createOrganizationOwner(
  actor: { id: string; email: string },
  organizationId: string,
  input: CreateOrganizationOwnerInput,
): Promise<{ user_id: string; email: string; full_name: string }> {
  const supabase = createServerSupabaseClient();
  const organization = await getPlatformOrganization(organizationId);
  if (!organization) {
    throw new Error("Organización no encontrada.");
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name.trim(),
      role: "admin",
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "No se pudo crear el owner.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Owner creado sin perfil.");
  }

  await syncOrganizationMembership(supabase, organizationId, authData.user.id, {
    profileRole: "admin",
    isActive: true,
  });

  await supabase
    .from("organization_members")
    .update({ role: "owner" })
    .eq("organization_id", organizationId)
    .eq("user_id", authData.user.id);

  await logPlatformAction({
    actorUserId: actor.id,
    actorEmail: actor.email,
    action: "organization.owner_created",
    entityType: "organization",
    entityId: organizationId,
    entityLabel: organization.name,
    metadata: { owner_email: profile.email, owner_user_id: profile.id },
  });

  return {
    user_id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
  };
}

export { normalizeSlug };
