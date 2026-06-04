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
import type { IndexQuality } from "@/lib/pdf/index-quality";

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
          organization_id: string | null;
          index_quality: IndexQuality;
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
          organization_id?: string | null;
          index_quality?: IndexQuality;
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
          organization_id?: string | null;
          index_quality?: IndexQuality;
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
          organization_id: string | null;
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
          organization_id?: string | null;
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
          organization_id?: string | null;
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
          organization_id: string | null;
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
          organization_id?: string | null;
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
          organization_id?: string | null;
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
          assignee_user_id: string | null;
          due_at: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          organization_id: string | null;
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
          assignee_user_id?: string | null;
          due_at?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          organization_id?: string | null;
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
          assignee_user_id?: string | null;
          due_at?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contract_versions: {
        Row: {
          id: string;
          contract_id: string;
          version_number: number;
          storage_path: string;
          file_hash: string;
          file_name: string;
          uploaded_by: string | null;
          uploaded_by_name: string | null;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          version_number: number;
          storage_path: string;
          file_hash: string;
          file_name: string;
          uploaded_by?: string | null;
          uploaded_by_name?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          version_number?: number;
          storage_path?: string;
          file_hash?: string;
          file_name?: string;
          uploaded_by?: string | null;
          uploaded_by_name?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contract_audits: {
        Row: {
          id: string;
          contract_id: string;
          contract_version_id: string | null;
          score_riesgo: number;
          analysis_result: Json;
          model: string;
          actor_user_id: string | null;
          actor_name: string;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          contract_version_id?: string | null;
          score_riesgo: number;
          analysis_result: Json;
          model?: string;
          actor_user_id?: string | null;
          actor_name?: string;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          contract_version_id?: string | null;
          score_riesgo?: number;
          analysis_result?: Json;
          model?: string;
          actor_user_id?: string | null;
          actor_name?: string;
          organization_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contract_comparisons: {
        Row: {
          id: string;
          organization_id: string;
          base_contract_id: string;
          compared_contract_id: string;
          base_file_name: string;
          compared_file_name: string;
          summary: string;
          risk_side: string;
          base_score: number;
          compared_score: number;
          critical_count: number;
          comparison_result: Json;
          model: string;
          actor_user_id: string | null;
          actor_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          base_contract_id: string;
          compared_contract_id: string;
          base_file_name: string;
          compared_file_name: string;
          summary: string;
          risk_side: string;
          base_score: number;
          compared_score: number;
          critical_count?: number;
          comparison_result: Json;
          model?: string;
          actor_user_id?: string | null;
          actor_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          base_contract_id?: string;
          compared_contract_id?: string;
          base_file_name?: string;
          compared_file_name?: string;
          summary?: string;
          risk_side?: string;
          base_score?: number;
          compared_score?: number;
          critical_count?: number;
          comparison_result?: Json;
          model?: string;
          actor_user_id?: string | null;
          actor_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      contract_ai_queries: {
        Row: {
          id: string;
          contract_id: string;
          modo: string;
          pregunta: string;
          respuesta_estructurada: Json;
          respuesta_texto: string;
          contexto_insuficiente: boolean;
          actor_user_id: string | null;
          actor_name: string;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          modo: string;
          pregunta: string;
          respuesta_estructurada: Json;
          respuesta_texto: string;
          contexto_insuficiente?: boolean;
          actor_user_id?: string | null;
          actor_name?: string;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          modo?: string;
          pregunta?: string;
          respuesta_estructurada?: Json;
          respuesta_texto?: string;
          contexto_insuficiente?: boolean;
          actor_user_id?: string | null;
          actor_name?: string;
          organization_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          contact_email: string | null;
          contact_phone: string | null;
          logo_url: string | null;
          report_disclaimer: string | null;
          report_responsible_name: string | null;
          status: string;
          plan: string;
          billing_email: string | null;
          trial_ends_at: string | null;
          suspended_at: string | null;
          created_by_platform_admin_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          logo_url?: string | null;
          report_disclaimer?: string | null;
          report_responsible_name?: string | null;
          status?: string;
          plan?: string;
          billing_email?: string | null;
          trial_ends_at?: string | null;
          suspended_at?: string | null;
          created_by_platform_admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          logo_url?: string | null;
          report_disclaimer?: string | null;
          report_responsible_name?: string | null;
          status?: string;
          plan?: string;
          billing_email?: string | null;
          trial_ends_at?: string | null;
          suspended_at?: string | null;
          created_by_platform_admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          user_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_audit_log: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_email: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          entity_label: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          actor_email?: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          entity_label?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          actor_email?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
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
          organization_id: string | null;
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
          organization_id?: string | null;
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
          organization_id?: string | null;
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
  index_quality: IndexQuality;
  index_warning?: string | null;
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
