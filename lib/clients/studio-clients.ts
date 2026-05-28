export type MatterType =
  | "general"
  | "contractual"
  | "corporate"
  | "tax"
  | "labor"
  | "litigation"
  | "compliance";

export type MatterStatus = "active" | "closed" | "archived";

export interface StudioClient {
  id: string;
  name: string;
  cuit: string | null;
  practice_area: string | null;
  responsible_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Matter {
  id: string;
  client_id: string;
  name: string;
  matter_type: MatterType;
  reference_code: string | null;
  status: MatterStatus;
  created_at: string;
  updated_at: string;
}

export const MATTER_TYPE_LABELS: Record<MatterType, string> = {
  general: "General",
  contractual: "Contractual",
  corporate: "Societario",
  tax: "Impositivo",
  labor: "Laboral",
  litigation: "Litigios",
  compliance: "Compliance",
};

export interface Client360Summary {
  client: StudioClient;
  matters: Matter[];
  contractCount: number;
  expiringCount: number;
  pendingObligations: number;
  openTasks: number;
}
