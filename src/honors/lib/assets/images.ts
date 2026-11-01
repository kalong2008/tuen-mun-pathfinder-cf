import { resolveHonorCode } from "./code";

export function getHonorImageUrl(code: string, aliases: string[] = []): string | undefined {
  const resolvedCode = resolveHonorCode(code, aliases);
  if (!resolvedCode) {
    return undefined;
  }

  return `/adventurer-honors/${resolvedCode}.png`;
}
