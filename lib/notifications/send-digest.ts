import {
  digestHasItems,
  gatherNotificationDigest,
} from "@/lib/notifications/gather-digest";
import {
  getNotificationConfig,
  isSmtpConfigured,
} from "@/lib/notifications/config";
import {
  buildDigestEmailHtml,
  buildDigestEmailSubject,
  buildDigestEmailText,
} from "@/lib/notifications/email-template";
import { sendEmail } from "@/lib/notifications/mailer";
import type { DigestSendResult, DigestSendSummary } from "@/lib/notifications/types";
import { logActivity } from "@/lib/contracts/activity-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

async function resolveRecipients(config: ReturnType<typeof getNotificationConfig>): Promise<string[]> {
  if (config.digestRecipients.length > 0) {
    return config.digestRecipients;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const emails = (data ?? [])
    .map((row) => row.email.trim().toLowerCase())
    .filter((email) => email.includes("@"));

  return [...new Set(emails)];
}

async function wasDigestSentToday(recipient: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notification_digest_log")
    .select("id")
    .eq("digest_date", todayDateString())
    .eq("recipient_email", recipient)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function recordDigestSent(
  recipient: string,
  digest: Awaited<ReturnType<typeof gatherNotificationDigest>>,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("notification_digest_log").insert({
    digest_date: todayDateString(),
    recipient_email: recipient,
    expirations_count: digest.expirations.length,
    tasks_count: digest.tasks.length,
    obligations_count: digest.obligations.length,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export interface SendDigestOptions {
  force?: boolean;
  dryRun?: boolean;
  organizationId?: string | null;
}

export async function sendNotificationDigest(
  options: SendDigestOptions = {},
): Promise<DigestSendSummary> {
  const config = getNotificationConfig();
  const digest = await gatherNotificationDigest(config, options.organizationId);
  const recipients = await resolveRecipients(config);
  const smtpConfigured = isSmtpConfigured(config);

  if (recipients.length === 0) {
    throw new Error(
      "No hay destinatarios. Configurá NOTIFICATION_DIGEST_TO o usuarios activos con email.",
    );
  }

  if (!options.dryRun && !smtpConfigured) {
    throw new Error("SMTP no configurado.");
  }

  const results: DigestSendResult[] = [];

  for (const recipient of recipients) {
    if (!options.force && !options.dryRun && (await wasDigestSentToday(recipient))) {
      results.push({ ok: true, skipped: true, recipient });
      continue;
    }

    if (!digestHasItems(digest)) {
      results.push({
        ok: true,
        skipped: true,
        recipient,
        error: "Sin alertas para notificar.",
      });
      continue;
    }

    if (options.dryRun) {
      results.push({ ok: true, skipped: false, recipient });
      continue;
    }

    try {
      const subject = buildDigestEmailSubject(digest);
      const html = buildDigestEmailHtml(digest, config.siteUrl);
      const text = buildDigestEmailText(digest, config.siteUrl);

      await sendEmail(config, { to: recipient, subject, html, text });
      await recordDigestSent(recipient, digest);

      results.push({ ok: true, skipped: false, recipient });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de envío.";
      results.push({ ok: false, skipped: false, recipient, error: message });
    }
  }

  const sentCount = results.filter((item) => item.ok && !item.skipped).length;

  if (!options.dryRun && sentCount > 0) {
    await logActivity({
      action: "notification.digest_sent",
      entityType: "notification",
      entityLabel: `Resumen enviado a ${sentCount} destinatario(s)`,
      metadata: {
        recipients: results.filter((item) => item.ok && !item.skipped).map((item) => item.recipient),
        expirations: digest.expirations.length,
        tasks: digest.tasks.length,
        obligations: digest.obligations.length,
      },
    });
  }

  return {
    digest,
    recipients,
    results,
    smtp_configured: smtpConfigured,
  };
}
