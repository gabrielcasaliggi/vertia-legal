export function buildContractStoragePath(
  contractId: string,
  organizationId?: string | null,
  versionNumber?: number,
): string {
  const base = organizationId ? `${organizationId}/${contractId}` : contractId;
  if (versionNumber && versionNumber > 1) {
    return `${base}/v${versionNumber}/document.pdf`;
  }
  return `${base}/document.pdf`;
}
