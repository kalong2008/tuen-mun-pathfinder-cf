import {
  buildRequirementTree,
  type RequirementNode,
  type RequirementListStyle,
} from "../markdown/requirements";
import {
  honorCategories,
  honorReviewStatuses,
  type AdventurerHonor,
  type HonorAnswer,
  type HonorCategory,
  type HonorStatus,
} from "./types";
import {
  normalizeAnswerSourceKind,
  normalizeAnswerSourceNote,
} from "./answer-source";

const REQUIREMENTS_HEADING = "## 要求";
const ANSWERS_HEADING = "## 答案";

function listMarker(style: RequirementListStyle, index: number): string {
  switch (style) {
    case "decimal":
      return `${index + 1}.`;
    case "lower-alpha":
      return `${String.fromCharCode(97 + index)}.`;
    case "lower-roman": {
      const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
      return `${romans[index] ?? `${index + 1}`}.`;
    }
    case "disc":
      return "-";
    default: {
      const unreachable: never = style;
      return unreachable;
    }
  }
}

function renderRequirementNodes(
  nodes: RequirementNode[],
  style: RequirementListStyle = "decimal",
  depth = 0,
): string {
  return nodes
    .map((node, index) => {
      const marker = listMarker(style, index);
      const prefix = marker === "-" ? "- " : `${marker} `;
      const indent = "   ".repeat(depth);
      const line = `${indent}${prefix}${node.text}`;

      if (node.children.length === 0 || !node.childListStyle) {
        return line;
      }

      return [line, renderRequirementNodes(node.children, node.childListStyle, depth + 1)].join("\n");
    })
    .join("\n");
}

export function requirementsToMarkdown(requirements: string[]): string {
  if (requirements.length === 0) {
    return "";
  }

  return renderRequirementTree(requirements);
}

function renderRequirementTree(requirements: string[]): string {
  return renderRequirementNodes(buildRequirementTree(requirements));
}

function renderAnswerSection(answer: HonorAnswer): string {
  return [`### 要求 ${answer.requirementIndex + 1}`, "", answer.text.trim()].join("\n");
}

export function buildHonorFrontmatter(
  honor: Pick<
    AdventurerHonor,
    | "id"
    | "code"
    | "nameZh"
    | "nameEn"
    | "aliases"
    | "category"
    | "answerSource"
    | "answerSourceNote"
    | "status"
  >,
): string {
  return [
    "---",
    `id: ${honor.id}`,
    `code: ${honor.code}`,
    `nameZh: ${JSON.stringify(honor.nameZh)}`,
    ...(honor.nameEn ? [`nameEn: ${JSON.stringify(honor.nameEn)}`] : []),
    ...(honor.aliases.length > 0
      ? ["aliases:", ...honor.aliases.map((alias) => `  - ${JSON.stringify(alias)}`)]
      : ["aliases: []"]),
    `category: ${honor.category}`,
    `answerSource: ${honor.answerSource}`,
    ...(honor.answerSourceNote
      ? [`answerSourceNote: ${JSON.stringify(honor.answerSourceNote)}`]
      : []),
    `status: ${honor.status}`,
    "---",
  ].join("\n");
}

export function buildHonorMarkdownBody(requirementsMarkdown: string, answers: HonorAnswer[]): string {
  const sections: string[] = [];

  if (requirementsMarkdown.trim()) {
    sections.push(REQUIREMENTS_HEADING, "", requirementsMarkdown.trim(), "");
  }

  if (answers.length > 0) {
    sections.push(ANSWERS_HEADING, "", answers.map(renderAnswerSection).join("\n\n"), "");
  }

  return sections.join("\n").trimEnd();
}

export type HonorMarkdownFileInput = Omit<AdventurerHonor, "hasDocxDownload">;

export function formatHonorMarkdownFile(honor: HonorMarkdownFileInput, body?: string): string {
  const frontmatter = buildHonorFrontmatter(honor);
  const markdownBody = body ?? buildHonorMarkdownBody(honor.requirementsMarkdown, honor.answers);
  return `${frontmatter}\n\n${markdownBody}\n`;
}

export function honorToMarkdown(honor: LegacyHonorInput): string {
  return formatHonorMarkdownFile({
    ...honor,
    requirementsMarkdown: requirementsToMarkdown(honor.requirements),
  });
}

export interface LegacyHonorInput {
  id: string;
  code: string;
  nameZh: string;
  nameEn?: string;
  aliases: string[];
  category: HonorCategory;
  requirements: string[];
  answers: HonorAnswer[];
  answerSource: AdventurerHonor["answerSource"];
  answerSourceNote?: string;
  status: HonorStatus;
}

export function parseHonorMarkdownBody(body: string): {
  requirementsMarkdown: string;
  answers: HonorAnswer[];
} {
  const requirementsMatch = body.match(
    new RegExp(`${escapeRegExp(REQUIREMENTS_HEADING)}\\s*\\n([\\s\\S]*?)(?=\\n${escapeRegExp(ANSWERS_HEADING)}|$)`),
  );
  const answersMatch = body.match(new RegExp(`${escapeRegExp(ANSWERS_HEADING)}\\s*\\n([\\s\\S]*)$`));

  const requirementsMarkdown = requirementsMatch?.[1]?.trim() ?? "";
  const answersMarkdown = answersMatch?.[1]?.trim() ?? "";

  return {
    requirementsMarkdown,
    answers: parseAnswerSections(answersMarkdown),
  };
}

function parseAnswerSections(answersMarkdown: string): HonorAnswer[] {
  if (!answersMarkdown) {
    return [];
  }

  const sections = answersMarkdown.split(/\n(?=### 要求 \d+\s*$)/m).filter(Boolean);
  const answers: HonorAnswer[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^### 要求 (\d+)\s*\n([\s\S]*)$/);
    if (!headingMatch) {
      continue;
    }

    const requirementIndex = Number(headingMatch[1]) - 1;
    const content = stripLegacyAnswerSourceLine(headingMatch[2].trim());

    answers.push({
      requirementIndex,
      text: content,
    });
  }

  return answers.sort((left, right) => left.requirementIndex - right.requirementIndex);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip legacy per-answer source lines from migrated markdown files. */
export function stripLegacyAnswerSourceLine(content: string): string {
  return content.replace(/\n> 來源：[^\n]+\s*$/, "").trim();
}

export type ParsedHonorFrontmatter = Omit<
  AdventurerHonor,
  "requirementsMarkdown" | "answers" | "hasDocxDownload"
>;

function parseHonorCategory(value: unknown): HonorCategory {
  const category = String(value ?? "");
  if (honorCategories.some((item) => item.id === category)) {
    return category as HonorCategory;
  }

  throw new Error(`Invalid honor category: ${category || "(empty)"}`);
}

function parseHonorStatus(value: unknown): HonorStatus {
  const status = String(value ?? "");
  if (honorReviewStatuses.some((item) => item.id === status)) {
    return status as HonorStatus;
  }

  throw new Error(`Invalid honor status: ${status || "(empty)"}`);
}

export function parseHonorFrontmatter(data: Record<string, unknown>): ParsedHonorFrontmatter {
  return {
    id: String(data.id),
    code: String(data.code),
    nameZh: String(data.nameZh),
    nameEn: data.nameEn ? String(data.nameEn) : undefined,
    aliases: Array.isArray(data.aliases) ? data.aliases.map(String) : [],
    category: parseHonorCategory(data.category),
    answerSource: normalizeAnswerSourceKind(data.answerSource),
    answerSourceNote: normalizeAnswerSourceNote(data.answerSourceNote, data.answerSource),
    status: parseHonorStatus(data.status),
  };
}
