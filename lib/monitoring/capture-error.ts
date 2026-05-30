export function captureError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[monitoring:${context}]`, message);

  if (process.env.SENTRY_DSN) {
    // Hook listo para integrar @sentry/nextjs cuando se configure DSN.
  }
}
