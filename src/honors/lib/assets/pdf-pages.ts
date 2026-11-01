import { resolveHonorCode } from "./code";

export type HonorPdfPageLink = {
  path: string;
};

export type HonorPdfLinks = {
  zh?: HonorPdfPageLink;
  en?: HonorPdfPageLink;
};

export function getHonorPdfLinks(code: string, aliases: string[] = []): HonorPdfLinks {
  const resolvedCode = resolveHonorCode(code, aliases);
  if (!resolvedCode) {
    return {};
  }

  return {
    zh: { path: `/adventurer-honors/pdf-pages/${resolvedCode}-zh.pdf` },
    en: { path: `/adventurer-honors/pdf-pages/${resolvedCode}-en.pdf` },
  };
}
