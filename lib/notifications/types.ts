export interface ExpirationDigestItem {
  id: string;
  file_name: string;
  client_name: string;
  expires_at: string;
  days_remaining: number;
}

export interface TaskDigestItem {
  id: string;
  title: string;
  assignee_name: string | null;
  due_at: string | null;
  days_until_due: number | null;
  priority: string;
  status: string;
  contract_id: string | null;
}

export interface ObligationDigestItem {
  id: string;
  title: string;
  contract_id: string;
  file_name: string;
  client_name: string;
  due_at: string | null;
  days_until_due: number | null;
  status: string;
  obligation_type: string;
}

export interface NotificationDigest {
  generated_at: string;
  expiration_horizon_days: number;
  expirations: ExpirationDigestItem[];
  tasks: TaskDigestItem[];
  obligations: ObligationDigestItem[];
}

export interface DigestSendResult {
  ok: boolean;
  skipped: boolean;
  recipient: string;
  error?: string;
}

export interface DigestSendSummary {
  digest: NotificationDigest;
  recipients: string[];
  results: DigestSendResult[];
  smtp_configured: boolean;
}
