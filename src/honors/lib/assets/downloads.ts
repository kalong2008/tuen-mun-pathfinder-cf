import { resolveHonorCode } from "./code";

export function getHonorDownloadUrl(code: string, aliases: string[] = []): string | undefined {
  const resolvedCode = resolveHonorCode(code, aliases);
  if (!resolvedCode) {
    return undefined;
  }

  return `/adventurer-honors/documents/${resolvedCode}.docx`;
}

export function honorHasDocxDownload(
  code: string,
  aliases: string[],
  availableDocx: Set<string>,
): boolean {
  const resolvedCode = resolveHonorCode(code, aliases);
  if (!resolvedCode) {
    return false;
  }

  return availableDocx.has(resolvedCode);
}
