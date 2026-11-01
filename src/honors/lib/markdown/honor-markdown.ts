import { normalizeChineseQuotes, splitTextWithLinks } from "./answer-format";

const FENCED_CODE = /(```[\s\S]*?```)/g;
const MARKDOWN_TOKEN = /(\[[^\]]*\]\([^)]*\)|!\[[^\]]*\]\([^)]*\))/g;
const INDENTED_LETTER_ITEM = /^(\s+)([a-z])\.\s+(.*)$/i;

/** CommonMark only treats `1.` as an ordered list, so indented `a.` lines collapse into the parent paragraph. */
function promoteIndentedLetterLists(markdown: string): string {
  let expectedLetter = "a";
  let activeIndent: string | null = null;
  let nextNumber = 1;

  return markdown
    .split("\n")
    .map((line) => {
      const match = INDENTED_LETTER_ITEM.exec(line);
      if (!match) {
        if (line.trim() !== "") {
          expectedLetter = "a";
          activeIndent = null;
          nextNumber = 1;
        }
        return line;
      }

      const [, indent, letter, rest] = match;
      const normalized = letter.toLowerCase();
      const continues = activeIndent === indent && normalized === expectedLetter;
      const starts = normalized === "a";

      if (!continues && !starts) {
        expectedLetter = "a";
        activeIndent = null;
        nextNumber = 1;
        return line;
      }

      if (!continues) {
        nextNumber = 1;
      }

      const number = nextNumber;
      nextNumber += 1;
      expectedLetter = String.fromCharCode(normalized.charCodeAt(0) + 1);
      activeIndent = indent;
      return `${indent}${number}. ${rest}`;
    })
    .join("\n");
}

function linkifyPlainText(text: string): string {
  const segments = splitTextWithLinks(text);
  if (segments.length === 1 && segments[0].type === "text") {
    return segments[0].value;
  }

  return segments
    .map((segment) =>
      segment.type === "link" ? `[${segment.value}](${segment.href})` : segment.value,
    )
    .join("");
}

/** Auto-link bare URLs and Chinese bible references before markdown rendering. */
export function linkifyHonorMarkdown(markdown: string): string {
  const normalized = normalizeChineseQuotes(markdown);

  return normalized
    .split(FENCED_CODE)
    .map((part) => {
      if (part.startsWith("```")) {
        return part;
      }

      return promoteIndentedLetterLists(part)
        .split(MARKDOWN_TOKEN)
        .map((segment) =>
          /^\[[^\]]*\]\([^)]*\)$/.test(segment) || /^!\[[^\]]*\]\([^)]*\)$/.test(segment)
            ? segment
            : linkifyPlainText(segment),
        )
        .join("");
    })
    .join("");
}

export const honorMarkdownClassName = [
  "honor-markdown max-w-none text-gray-900",
  "[&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3:first-child]:mt-0",
  "[&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-gray-800",
  "[&_p]:leading-relaxed [&_p+p]:mt-3 [&_p+ol]:mt-3 [&_p+ul]:mt-3",
  "[&_ul]:ml-5 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
  "[&_ol]:ml-5 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:text-gray-700",
  "[&_ol_ol]:mt-2 [&_ol_ol]:list-[lower-alpha]",
  "[&_ol_ul]:mt-2 [&_ol_ul]:list-disc",
  "[&_ul_ul]:mt-2",
  "[&_li]:pl-1 [&_li]:leading-relaxed",
  "[&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-sm [&_blockquote]:text-gray-500",
  "[&_a]:break-all [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-blue-800",
  "[&_strong]:font-semibold [&_strong]:text-gray-800",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-800",
  "[&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_input[type='checkbox']]:mr-2",
  "[&_dl]:my-3 [&_dl]:space-y-2",
  "[&_dt]:font-semibold [&_dt]:text-gray-800",
  "[&_dd]:ml-5 [&_dd]:text-gray-700",
  "[&_.honor-alert]:my-3 [&_.honor-alert]:rounded-xl [&_.honor-alert]:border [&_.honor-alert]:px-4 [&_.honor-alert]:py-3 [&_.honor-alert]:text-sm",
  "[&_.honor-alert-note]:border-blue-200 [&_.honor-alert-note]:bg-blue-50 [&_.honor-alert-note]:text-blue-900",
  "[&_.honor-alert-warning]:border-amber-200 [&_.honor-alert-warning]:bg-amber-50 [&_.honor-alert-warning]:text-amber-900",
  "[&_.honor-alert-tip]:border-emerald-200 [&_.honor-alert-tip]:bg-emerald-50 [&_.honor-alert-tip]:text-emerald-900",
  "[&_.honor-youtube]:my-3 [&_.honor-youtube]:aspect-video [&_.honor-youtube]:w-full [&_.honor-youtube]:overflow-hidden [&_.honor-youtube]:rounded-xl",
  "[&_.honor-youtube_iframe]:h-full [&_.honor-youtube_iframe]:w-full [&_.honor-youtube_iframe]:border-0",
  "[&_.footnotes]:mt-4 [&_.footnotes]:border-t [&_.footnotes]:border-gray-200 [&_.footnotes]:pt-3 [&_.footnotes]:text-sm [&_.footnotes]:text-gray-600",
  "[&_.footnotes_ol]:ml-5 [&_.footnotes_ol]:list-decimal [&_.footnotes_ol]:space-y-1",
  "[&_.footnote-ref]:text-blue-600",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-gray-100",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
  "[&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:bg-gray-100 [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:py-0.5",
  "[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto",
].join(" ");
