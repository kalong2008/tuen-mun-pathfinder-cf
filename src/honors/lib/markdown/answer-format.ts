import { findBibleReferenceLinks } from "./bible-reference";

export type AnswerBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; content: string }
  | { type: "list"; items: string[] };

const SECTION_HEADER_PATTERN =
  /(榮譽證目的|教學目的|目的|教學概念|教學理念|教導概念|帶領提示|帶領建議|安全注意|準備|材料|程序|步驟|時間|注意|連結|書籍選項|取得書籍的地點|想法|資源|建議)([：:])/g;

const INLINE_LETTER_ITEM_PATTERN =
  /(?:^|[\s；]|(?<=：))([a-z])\.\s([\s\S]*?)(?=(?:[\s；][a-z]\.\s)|$)/gi;

const INLINE_CAPS_LETTER_ITEM_PATTERN =
  /(?:^|[\s；]|(?<=：))([A-Z])\.\s([\s\S]*?)(?=(?:[\s；][A-Z]\.\s)|$)/g;

const URL_PATTERN =
  /(?:https?:\/\/[^\s，。；）\]"'<>]+|(?:[a-z0-9-]+\.)+(?:org|com|inst|net|edu)(?:\/[^\s，。；）\]"'<>]*)?)/gi;

export interface TextSegment {
  type: "text" | "link";
  value: string;
  href?: string;
}

const WESTERN_QUOTE = /[\u201c\u201d"]/g;

export function normalizeChineseQuotes(text: string): string {
  let result = text
    .replace(/\u201c([^\u201d]*)\u201d/g, "「$1」")
    .replace(/"([^"]*)"/g, "「$1」")
    .replace(/\\"([^\\"]*)\\"/g, "「$1」")
    .replace(/\\"([^\\"]*)\u201d/g, "「$1」")
    .replace(/\u201c([^\\"]*)\\"/g, "「$1」");

  let open = true;
  return result.replace(WESTERN_QUOTE, () => {
    const quote = open ? "「" : "」";
    open = !open;
    return quote;
  });
}

function normalizeLinkHref(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value.replace(/^\/\//, "")}`;
}

type InlineLinkMatch = { start: number; end: number; value: string; href: string };

function collectInlineLinkMatches(text: string): InlineLinkMatch[] {
  const matches: InlineLinkMatch[] = [];

  for (const match of text.matchAll(URL_PATTERN)) {
    const value = match[0];
    const start = match.index ?? 0;
    matches.push({
      start,
      end: start + value.length,
      value,
      href: normalizeLinkHref(value),
    });
  }

  for (const link of findBibleReferenceLinks(text)) {
    matches.push({
      start: link.start,
      end: link.end,
      value: text.slice(link.start, link.end),
      href: link.href,
    });
  }

  return matches.sort((a, b) => a.start - b.start || b.end - a.end);
}

export function splitTextWithLinks(text: string): TextSegment[] {
  const matches = collectInlineLinkMatches(text);
  if (matches.length === 0) {
    return [{ type: "text", value: text }];
  }

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    if (match.start < lastIndex) {
      continue;
    }

    if (match.start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.start) });
    }

    segments.push({
      type: "link",
      value: match.value,
      href: match.href,
    });

    lastIndex = match.end;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

function extractBulletList(text: string): { intro: string; items: string[] } | null {
  if (!text.includes("•")) {
    return null;
  }

  const firstBullet = text.indexOf("•");
  const intro = text.slice(0, firstBullet).trim();
  const items = text
    .slice(firstBullet)
    .split(/\s•\s/)
    .map((item) => item.replace(/^•\s*/, "").trim())
    .filter(Boolean);

  if (items.length < 2) {
    return null;
  }

  return { intro, items };
}

function extractInlineLetterList(text: string): { intro: string; items: string[] } | null {
  const pattern = /[a-z]\.\s/.test(text) ? INLINE_LETTER_ITEM_PATTERN : INLINE_CAPS_LETTER_ITEM_PATTERN;
  const matches = [...text.matchAll(pattern)];

  if (matches.length < 2) {
    return null;
  }

  const firstIndex = matches[0].index ?? 0;
  const intro = text.slice(0, firstIndex).trim();
  const items = matches.map((match) => match[2].trim()).filter(Boolean);

  return { intro, items };
}

function extractEnumerationList(text: string): string[] | null {
  const trimmed = text.replace(/[。．.!！?？]$/, "").trim();
  if (!trimmed.includes("、")) {
    return null;
  }

  const parts = trimmed.split("、").map((part) => part.trim());
  if (parts.length < 3 || parts.some((part) => part.length > 40)) {
    return null;
  }

  return parts;
}

function splitBySectionHeaders(text: string): Array<{ header?: string; body: string }> {
  const matches = [...text.matchAll(SECTION_HEADER_PATTERN)];
  if (matches.length === 0) {
    return [{ body: text }];
  }

  const sections: Array<{ header?: string; body: string }> = [];
  let cursor = 0;

  for (const match of matches) {
    const index = match.index ?? 0;
    if (index > cursor) {
      sections.push({ body: text.slice(cursor, index).trim() });
    }

    sections.push({
      header: `${match[1]}${match[2]}`,
      body: "",
    });
    cursor = index + match[0].length;
  }

  const trailing = text.slice(cursor).trim();
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    lastSection.body = trailing;
  } else if (trailing) {
    sections.push({ body: trailing });
  }

  return sections.filter((section) => section.header || section.body);
}

function parseSectionBody(body: string): AnswerBlock[] {
  const trimmed = body.trim();
  if (!trimmed) {
    return [];
  }

  const bulletList = extractBulletList(trimmed);
  if (bulletList) {
    const blocks: AnswerBlock[] = [];
    if (bulletList.intro) {
      blocks.push({ type: "paragraph", content: bulletList.intro });
    }
    blocks.push({ type: "list", items: bulletList.items });
    return blocks;
  }

  const letterList = extractInlineLetterList(trimmed);
  if (letterList) {
    const blocks: AnswerBlock[] = [];
    if (letterList.intro) {
      blocks.push({ type: "paragraph", content: letterList.intro });
    }
    blocks.push({ type: "list", items: letterList.items });
    return blocks;
  }

  const enumerationList = extractEnumerationList(trimmed);
  if (enumerationList) {
    return [{ type: "list", items: enumerationList }];
  }

  return [{ type: "paragraph", content: trimmed }];
}

export function parseHonorAnswer(text: string): AnswerBlock[] {
  const sections = splitBySectionHeaders(text);
  const blocks: AnswerBlock[] = [];

  for (const section of sections) {
    if (section.header) {
      blocks.push({ type: "heading", content: section.header });
    }

    blocks.push(...parseSectionBody(section.body));
  }

  return blocks;
}

export function getAnswerListClassName(nested = false): string {
  return [
    "list-disc list-outside space-y-1.5 text-gray-900",
    nested ? "mt-2 ml-5 pl-5" : "ml-5 pl-5",
  ].join(" ");
}
