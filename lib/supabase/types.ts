import type { ContractAnalysisResult } from "@/lib/contracts/analysis";
import type { DocumentCategory } from "@/lib/contracts/document-categories";
import type { LifecycleStatus } from "@/lib/contracts/lifecycle";
import type {
  ObligationSource,
  ObligationStatus,
  ObligationType,
} from "@/lib/contracts/obligations";
import type { ProcessingPhase } from "@/lib/contracts/pipeline-phases";
import type { TaskPriority, TaskStatus } from "@/lib/contracts/tasks";
import type { MatterStatus, MatterType } from "@/lib/clients/studio-clients";
import type { UserRole } from "@/lib/auth/roles";

export type ContractStatus = "indexed" | "analyzed" | "failed" | "pending_analysis";

export interface ContractMetadata {
  monto?: number | null;
  moneda?: string | null;
  obligaciones_clave?: string[];
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      legal_contracts: {
        Row: {
          id: string;
          file_name: string;
          storage_path: string;
          file_hash: string;
          status: ContractStatus;
          processing_phase: ProcessingPhase;
          extracted_text: string | null;
          client_name: string;
          folder_name: string;
          starts_at: string | null;
          expires_at: string | null;
          contract_type: string | null;
          party_a: string | null;
          party_b: string | null;
          lifecycle_status: LifecycleStatus;
          contract_metadata: ContractMetadata | null;
          auto_renewal: boolean;
          renewal_notice_days: number | null;
          analysis_result: ContractAnalysisResult | null;
          archived_at: string | null;
          client_id: string | null;
          matter_id: string | null;
          document_category: DocumentCategory | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          storage_path: string;
          file_hash: string;
          status?: ContractStatus;
          processing_phase?: ProcessingPhase;
          extracted_text?: string | null;
          client_name?: string;
          folder_name?: string;
          starts_at?: string | null;
          expires_at?: string | null;
          contract_type?: string | null;
          party_a?: string | null;
          party_b?: string | null;
          lifecycle_status?: LifecycleStatus;
          contract_metadata?: ContractMetadata | null;
          auto_renewal?: boolean;
          renewal_notice_days?: number | null;
          analysis_result?: ContractAnalysisResult | null;
          archived_at?: string | null;
          client_id?: string | null;
          matter_id?: string | null;
          document_category?: DocumentCategory | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          storage_path?: string;
          file_hash?: string;
          status?: ContractStatus;
          processing_phase?: ProcessingPhase;
          extracted_text?: string | null;
          client_name?: string;
          folder_name?: string;
          starts_at?: string | null;
          expires_at?: string | null;
          contract_type?: string | null;
          party_a?: string | null;
          party_b?: string | null;
          lifecycle_status?: LifecycleStatus;
          contract_metadata?: ContractMetadata | null;
          auto_renewal?: boolean;
          renewal_notice_days?: number | null;
          analysis_result?: ContractAnalysisResult | null;
          archived_at?: string | null;
          client_id?: string | null;
          matter_id?: string | null;
          document_category?: DocumentCategory | null;
          created_at?: string;
        };
        Relationships: [];
      };
      studio_clients: {
        Row: {
          id: string;
          name: string;
          cuit: string | null;
          practice_area: string | null;
          responsible_name: string | null;
          contact_email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cuit?: string | null;
          practice_area?: string | null;
          responsible_name?: string | null;
          contact_email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cuit?: string | null;
          practice_area?: string | null;
          responsible_name?: string | null;
          contact_email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matters: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          matter_type: MatterType;
          reference_code: string | null;
          status: MatterStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          matter_type?: MatterType;
          reference_code?: string | null;
          status?: MatterStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          matter_type?: MatterType;
          reference_code?: string | null;
          status?: MatterStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          entity_label: string | null;
          actor_name: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          entity_label?: string | null;
          actor_name?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          actor_name?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contract_tasks: {
        Row: {
          id: string;
          contract_id: string | null;
          obligation_id: string | null;
          client_id: string | null;
          title: string;
          description: string | null;
          assignee_name: string | null;
          due_at: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id?: string | null;
          obligation_id?: string | null;
          client_id?: string | null;
          title: string;
          description?: string | null;
          assignee_name?: string | null;
          due_at?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string | null;
          obligation_id?: string | null;
          client_id?: string | null;
          title?: string;
          description?: string | null;
          assignee_name?: string | null;
          due_at?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_digest_log: {
        Row: {
          id: string;
          digest_date: string;
          recipient_email: string;
          expirations_count: number;
          tasks_count: number;
          obligations_count: number;
          sent_at: string;
        };
        Insert: {
          id?: string;
          digest_date?: string;
          recipient_email: string;
          expirations_count?: number;
          tasks_count?: number;
          obligations_count?: number;
          sent_at?: string;
        };
        Update: {
          id?: string;
          digest_date?: string;
          recipient_email?: string;
          expirations_count?: number;
          tasks_count?: number;
          obligations_count?: number;
          sent_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contract_obligations: {
        Row: {
          id: string;
          contract_id: string;
          title: string;
          due_at: string | null;
          obligation_type: ObligationType;
          status: ObligationStatus;
          source: ObligationSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          title: string;
          due_at?: string | null;
          obligation_type?: ObligationType;
          status?: ObligationStatus;
          source?: ObligationSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          title?: string;
          due_at?: string | null;
          obligation_type?: ObligationType;
          status?: ObligationStatus;
          source?: ObligationSource;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type LegalContract = Database["public"]["Tables"]["legal_contracts"]["Row"];

export interface ContractIndexResponse {
  id: string;
  file_name: string;
  storage_path: string;
  file_hash: string;
  status: "indexed";
  processing_phase: "completed";
  client_name: string;
  folder_name: string;
  starts_at: string | null;
  expires_at: string | null;
  lifecycle_status: LifecycleStatus;
  created_at: string;
}

export interface ContractListItem {
  id: string;
  file_name: string;
  client_name: string;
  folder_name: string;
  status: ContractStatus;
  file_hash: string;
  created_at: string;
  starts_at: string | null;
  expires_at: string | null;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  lifecycle_status: LifecycleStatus;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

export type { ContractSearchMatch } from "@/lib/contracts/search-intelligence";
export type { RiesgoNivel } from "@/lib/contracts/search-intelligence";
