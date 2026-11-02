import type { HonorPageAnswer } from "./data/types";

const HEADING = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

export function htmlToText(html: string): string {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeHonorHtml(html: string): string {
  const withoutDangerousTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(?:iframe|object|embed|link|meta|base|form|svg)\b[^>]*>/gi, "");
  const withoutHandlers = withoutDangerousTags
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(?:href|src)\s*=\s*("[^"]*"|'[^']*')/gi, (attribute, quoted: string) => {
      const value = quoted.slice(1, -1).trim();
      if (/^(javascript|data):/i.test(value)) return "";
      return attribute;
    })
    .replace(/\s+style\s*=\s*("[^"]*"|'[^']*')/gi, (attribute) =>
      /javascript:|expression\s*\(/i.test(attribute) ? "" : attribute,
    );
  return withoutHandlers.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const cleaned = attrs
      .replace(/\s+target\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+rel\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    return `<a${cleaned} target="_blank" rel="noopener noreferrer">`;
  });
}

export function splitAnswerHtml(html: string): { prefaceHtml: string; answers: HonorPageAnswer[] } {
  const source = sanitizeHonorHtml(html).trim();
  if (!source) return { prefaceHtml: "", answers: [] };

  const starts: { index: number; requirementIndex: number }[] = [];
  for (const match of source.matchAll(HEADING)) {
    if (match.index === undefined) continue;
    const text = htmlToText(match[2] ?? "");
    const number = /^要求\s*(\d+)/.exec(text);
    if (!number) continue;
    starts.push({ index: match.index, requirementIndex: Number(number[1]) - 1 });
  }

  if (starts.length === 0) {
    return { prefaceHtml: source, answers: [] };
  }

  return {
    prefaceHtml: source.slice(0, starts[0]?.index ?? 0).trim(),
    answers: starts.map((start, index) => {
      const end = starts[index + 1]?.index ?? source.length;
      const section = source.slice(start.index, end).trim();
      return {
        requirementIndex: start.requirementIndex,
        html: section.replace(/^<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/i, "").trim(),
      };
    }),
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}
