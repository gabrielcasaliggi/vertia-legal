export type DocumentCategory =
  | "contract"
  | "corporate"
  | "tax"
  | "power_of_attorney"
  | "lease"
  | "employment"
  | "other";

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: "Contrato",
  corporate: "Societario / Actas",
  tax: "Impositivo / Fiscal",
  power_of_attorney: "Poder / Mandato",
  lease: "Locación",
  employment: "Laboral",
  other: "Otro",
};

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "contract",
  "corporate",
  "tax",
  "power_of_attorney",
  "lease",
  "employment",
  "other",
];

export function isDocumentCategory(value: string): value is DocumentCategory {
  return DOCUMENT_CATEGORIES.includes(value as DocumentCategory);
}

export function documentCategoryLabel(value: string | null | undefined): string {
  if (!value || !isDocumentCategory(value)) {
    return "Sin clasificar";
  }
  return DOCUMENT_CATEGORY_LABELS[value];
}
