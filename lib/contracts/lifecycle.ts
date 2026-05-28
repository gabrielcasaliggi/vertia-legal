export type LifecycleStatus = "draft" | "active" | "expiring" | "expired" | "unknown";

const EXPIRING_WINDOW_DAYS = 30;

export const LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  draft: "Borrador",
  active: "Vigente",
  expiring: "Por vencer",
  expired: "Vencido",
  unknown: "Sin determinar",
};

export function computeDaysUntilExpiry(
  expiresAt: string | null | undefined,
  reference = new Date(),
): number | null {
  if (!expiresAt) {
    return null;
  }

  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return null;
  }

  const ref = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );
  const target = Date.UTC(
    expires.getUTCFullYear(),
    expires.getUTCMonth(),
    expires.getUTCDate(),
  );

  return Math.round((target - ref) / 86_400_000);
}

export function computeLifecycleStatus(
  startsAt: string | null | undefined,
  expiresAt: string | null | undefined,
  reference = new Date(),
): LifecycleStatus {
  const daysUntilExpiry = computeDaysUntilExpiry(expiresAt, reference);

  if (daysUntilExpiry !== null) {
    if (daysUntilExpiry < 0) {
      return "expired";
    }
    if (daysUntilExpiry <= EXPIRING_WINDOW_DAYS) {
      return "expiring";
    }
    return "active";
  }

  if (startsAt) {
    const starts = new Date(startsAt);
    if (!Number.isNaN(starts.getTime()) && starts.getTime() > reference.getTime()) {
      return "draft";
    }
    return "active";
  }

  return "unknown";
}

export function lifecycleBadgeClass(status: LifecycleStatus): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "expiring":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "expired":
      return "border-red-200 bg-red-50 text-red-800";
    case "draft":
      return "border-slate-300 bg-slate-50 text-slate-700";
    default:
      return "border-corp-border bg-corp-surface text-corp-muted";
  }
}

export function formatExpiryLabel(
  expiresAt: string | null | undefined,
  reference = new Date(),
): string {
  const days = computeDaysUntilExpiry(expiresAt, reference);

  if (days === null) {
    return "Vigencia no determinada";
  }
  if (days < 0) {
    return `Vencido hace ${Math.abs(days)} día(s)`;
  }
  if (days === 0) {
    return "Vence hoy";
  }
  return `Vence en ${days} día(s)`;
}
