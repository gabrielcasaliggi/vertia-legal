import nodemailer from "nodemailer";
import type { NotificationConfig } from "@/lib/notifications/config";
import { isSmtpConfigured } from "@/lib/notifications/config";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(
  config: NotificationConfig,
  input: SendEmailInput,
): Promise<void> {
  if (!isSmtpConfigured(config)) {
    throw new Error(
      "SMTP no configurado. Definí SMTP_HOST, SMTP_FROM y credenciales en el entorno.",
    );
  }

  const transport = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth:
      config.smtpUser && config.smtpPass
        ? { user: config.smtpUser, pass: config.smtpPass }
        : undefined,
  });

  await transport.sendMail({
    from: config.smtpFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
