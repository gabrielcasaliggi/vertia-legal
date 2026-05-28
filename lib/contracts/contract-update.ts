import { computeLifecycleStatus } from "@/lib/contracts/lifecycle";
import type { ContractMetadata } from "@/lib/supabase/types";

export interface ContractUpdateInput {
  file_name?: string;
  client_name?: string;
  folder_name?: string;
  contract_type?: string | null;
  party_a?: string | null;
  party_b?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  auto_renewal?: boolean;
  renewal_notice_days?: number | null;
  contract_metadata?: ContractMetadata | null;
}

function parseOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`).toISOString();
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRequiredString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseContractUpdateBody(body: unknown): ContractUpdateInput | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const payload = body as Record<string, unknown>;
  const update: ContractUpdateInput = {};

  const fileName = parseRequiredString(payload.file_name);
  if (fileName) {
    update.file_name = fileName;
  }

  const clientName = parseRequiredString(payload.client_name);
  if (clientName) {
    update.client_name = clientName;
  }

  const folderName = parseRequiredString(payload.folder_name);
  if (folderName) {
    update.folder_name = folderName;
  }

  if ("contract_type" in payload) {
    const contractType = parseOptionalString(payload.contract_type);
    if (contractType !== undefined) {
      update.contract_type = contractType;
    }
  }

  if ("party_a" in payload) {
    const partyA = parseOptionalString(payload.party_a);
    if (partyA !== undefined) {
      update.party_a = partyA;
    }
  }

  if ("party_b" in payload) {
    const partyB = parseOptionalString(payload.party_b);
    if (partyB !== undefined) {
      update.party_b = partyB;
    }
  }

  if ("starts_at" in payload) {
    const startsAt = parseOptionalDate(payload.starts_at);
    if (startsAt !== undefined) {
      update.starts_at = startsAt;
    }
  }

  if ("expires_at" in payload) {
    const expiresAt = parseOptionalDate(payload.expires_at);
    if (expiresAt !== undefined) {
      update.expires_at = expiresAt;
    }
  }

  if ("auto_renewal" in payload) {
    update.auto_renewal = payload.auto_renewal === true;
  }

  if ("renewal_notice_days" in payload) {
    if (payload.renewal_notice_days === null || payload.renewal_notice_days === "") {
      update.renewal_notice_days = null;
    } else if (
      typeof payload.renewal_notice_days === "number" &&
      Number.isFinite(payload.renewal_notice_days)
    ) {
      update.renewal_notice_days = payload.renewal_notice_days;
    }
  }

  return Object.keys(update).length > 0 ? update : null;
}

export function buildPersistedUpdate(
  input: ContractUpdateInput,
  current: {
    starts_at: string | null;
    expires_at: string | null;
  },
): ContractUpdateInput & { lifecycle_status: ReturnType<typeof computeLifecycleStatus> } {
  const startsAt = input.starts_at !== undefined ? input.starts_at : current.starts_at;
  const expiresAt = input.expires_at !== undefined ? input.expires_at : current.expires_at;

  return {
    ...input,
    lifecycle_status: computeLifecycleStatus(startsAt, expiresAt),
  };
}
