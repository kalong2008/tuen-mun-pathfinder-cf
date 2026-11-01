import matter from "gray-matter";

import { getAvailableDocxCodes } from "../assets/docx-inventory";
import { honorHasDocxDownload } from "../assets/downloads";
import { expandHonorMarkdownPlaceholders } from "../markdown/samples/placeholders";
import { parseHonorFrontmatter, parseHonorMarkdownBody } from "./serialize";
import type { AdventurerHonor } from "./types";

/** Markdown fixtures excluded from the admin honor grid. */
export const HONOR_FIXTURE_IDS = new Set(["test0000-markdown-styles"]);

const honorFiles = import.meta.glob("../../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

let cachedHonors: AdventurerHonor[] | null = null;

export function loadAdventurerHonors(): AdventurerHonor[] {
  if (cachedHonors) return cachedHonors;

  const availableDocx = getAvailableDocxCodes();
  cachedHonors = Object.entries(honorFiles)
    .sort(([left], [right]) => left.localeCompare(right, "zh-Hant"))
    .map(([, raw]) => loadHonorFromMarkdown(String(raw), availableDocx))
    .filter((honor) => !HONOR_FIXTURE_IDS.has(honor.id));

  return cachedHonors;
}

function loadHonorFromMarkdown(raw: string, availableDocx: Set<string>): AdventurerHonor {
  const { data, content } = matter(raw);
  const metadata = parseHonorFrontmatter(data as Record<string, unknown>);
  const expandedContent = expandHonorMarkdownPlaceholders(content);
  const { requirementsMarkdown, answers } = parseHonorMarkdownBody(expandedContent);

  return {
    ...metadata,
    requirementsMarkdown,
    answers,
    hasDocxDownload: honorHasDocxDownload(metadata.code, metadata.aliases, availableDocx),
  };
}
