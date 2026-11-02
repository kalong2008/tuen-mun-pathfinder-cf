import type { HonorAnswerSourceKind } from "./types";

export type { HonorAnswerSourceKind } from "./types";
export { answerSourceKinds } from "./types";

export const answerSourceOptions: {
  id: HonorAnswerSourceKind;
  label: string;
}[] = [
  {
    id: "translated",
    label: "英文 Award Book 2020 Supporting Answers（AI 翻譯）",
  },
  {
    id: "draft",
    label: "按中文要求 AI 草擬（未有 Supporting Answers）",
  },
];

export const ANSWER_SOURCE_TRANSLATED =
  "答案取自英文 Award Book 2020 Supporting Answers，並以 AI 翻譯成中文";

export const ANSWER_SOURCE_DRAFTED =
  "英文 Award Book 2020 未有 Supporting Answers；答案按中文要求由 AI 草擬";

export const ANSWER_SOURCE_PENDING = "答案待核對";

function extractLegacyNote(value: string): string {
  const notes = value.match(/（[^）]+）/g) ?? [];

  return notes
    .filter(
      (note) =>
        !note.includes("未有 Supporting Answers") &&
        !note.includes("整理/翻譯") &&
        !note.includes("草擬"),
    )
    .map((note) => note.slice(1, -1))
    .join("");
}

function isLegacyDraft(value: string): boolean {
  return value.includes("草擬") || value.includes("未有 Supporting Answers");
}

function isLegacyTranslated(value: string): boolean {
  return (
    value.includes("整理/翻譯") ||
    (value.includes("Award Book") && !isLegacyDraft(value))
  );
}

export function normalizeAnswerSourceKind(raw: unknown): HonorAnswerSourceKind {
  const value = String(raw ?? "").trim();

  if (value === "translated" || value === "draft") {
    return value;
  }

  if (value === "" || isLegacyDraft(value)) {
    return "draft";
  }

  if (isLegacyTranslated(value)) {
    return "translated";
  }

  return "draft";
}

export function normalizeAnswerSourceNote(
  noteRaw: unknown,
  answerSourceRaw: unknown,
): string | undefined {
  const explicitNote = String(noteRaw ?? "").trim();
  if (explicitNote) {
    return explicitNote;
  }

  const legacyNote = extractLegacyNote(String(answerSourceRaw ?? "").trim());
  return legacyNote || undefined;
}

export function formatAnswerSourceNote(note?: string): string {
  if (!note?.trim()) {
    return "";
  }

  const trimmed = note.trim();
  return trimmed.startsWith("（") ? trimmed : `（${trimmed}）`;
}

export function getAnswerSourceLabel(honor: {
  answers: readonly unknown[];
  answerSource: HonorAnswerSourceKind;
  answerSourceNote?: string;
  answerPrefaceHtml?: string;
}): string {
  if (honor.answers.length === 0 && !honor.answerPrefaceHtml?.trim()) {
    return ANSWER_SOURCE_PENDING;
  }

  const note = formatAnswerSourceNote(honor.answerSourceNote);

  if (honor.answerSource === "translated") {
    return `${ANSWER_SOURCE_TRANSLATED}${note}`;
  }

  return `${ANSWER_SOURCE_DRAFTED}${note}`;
}
