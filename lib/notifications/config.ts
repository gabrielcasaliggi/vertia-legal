export interface NotificationConfig {
  smtpHost: string | undefined;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | undefined;
  smtpPass: string | undefined;
  smtpFrom: string | undefined;
  digestRecipients: string[];
  cronSecret: string | undefined;
  expirationHorizonDays: number;
  taskHorizonDays: number;
  obligationHorizonDays: number;
  siteUrl: string;
}

function parseRecipientList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes("@"));
}

export function getNotificationConfig(): NotificationConfig {
  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);

  return {
    smtpHost: process.env.SMTP_HOST?.trim(),
    smtpPort: Number.isNaN(port) ? 587 : port,
    smtpSecure: process.env.SMTP_SECURE === "true",
    smtpUser: process.env.SMTP_USER?.trim(),
    smtpPass: process.env.SMTP_PASS?.trim(),
    smtpFrom: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim(),
    digestRecipients: parseRecipientList(process.env.NOTIFICATION_DIGEST_TO),
    cronSecret: process.env.NOTIFICATION_CRON_SECRET?.trim(),
    expirationHorizonDays: Number.parseInt(
      process.env.NOTIFICATION_EXPIRY_DAYS ?? "30",
      10,
    ) || 30,
    taskHorizonDays: Number.parseInt(process.env.NOTIFICATION_TASK_DAYS ?? "7", 10) || 7,
    obligationHorizonDays:
      Number.parseInt(process.env.NOTIFICATION_OBLIGATION_DAYS ?? "14", 10) || 14,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  };
}

export function isSmtpConfigured(config: NotificationConfig): boolean {
  return Boolean(config.smtpHost && config.smtpFrom);
}

export function isCronAuthorized(
  authorizationHeader: string | null,
  config: NotificationConfig,
): boolean {
  if (!config.cronSecret) {
    return false;
  }
  const expected = `Bearer ${config.cronSecret}`;
  return authorizationHeader === expected;
}
