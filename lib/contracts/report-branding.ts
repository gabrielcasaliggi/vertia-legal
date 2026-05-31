import type { OrganizationSettings } from "@/lib/organizations/settings";
import {
  resolveReportBrandName,
  resolveReportDisclaimer,
} from "@/lib/organizations/settings";

export interface ReportBranding {
  brandName: string;
  responsibleName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  disclaimer: string;
}

export function buildReportBranding(
  settings: OrganizationSettings | null,
): ReportBranding {
  return {
    brandName: resolveReportBrandName(settings),
    responsibleName: settings?.report_responsible_name ?? null,
    contactEmail: settings?.contact_email ?? null,
    contactPhone: settings?.contact_phone ?? null,
    logoUrl: settings?.logo_url ?? null,
    disclaimer: resolveReportDisclaimer(settings),
  };
}
