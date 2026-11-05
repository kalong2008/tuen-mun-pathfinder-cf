import { adventurerHonors } from "@schema";
import { and, db, eq } from "void/db";
import { htmlToText, sanitizeHonorHtml, splitAnswerHtml } from "../honors/lib/html";
import type {
  HonorAnswerSourceKind,
  HonorCategory,
  HonorHandbooks,
  HonorPageRecord,
  HonorStatus,
} from "../honors/lib/data/types";
import { normalizeAnswerSourceKind, normalizeAnswerSourceNote } from "../honors/lib/data/answer-source";
import {
  HANDBOOK_FIELDS,
  HANDBOOK_ROW_ID,
  HANDBOOK_WORKSHEET_ID,
} from "./adventurer-honors";
import { getWorksheetRow } from "./nocoly";

function categoryId(label: string): HonorCategory | null {
  switch (label) {
    case "社區關懷":
      return "community";
    case "美術工藝":
      return "arts-crafts";
    case "家事技藝":
      return "household";
    case "自然研究":
      return "nature";
    case "康樂活動":
      return "recreation";
    case "屬靈生活":
      return "spiritual";
    default:
      return null;
  }
}

function statusId(label: string): HonorStatus {
  switch (label) {
    case "已核對":
      return "reviewed";
    case "待核對":
      return "non-review";
    default:
      return "non-review";
  }
}

function answerSourceId(label: string): HonorAnswerSourceKind {
  switch (label) {
    case "譯文":
      return "translated";
    case "草稿":
      return "draft";
    default:
      return normalizeAnswerSourceKind(label);
  }
}

function aliasesOf(value: string): string[] {
  return value
    .split(/[\n,，、]/)
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function hasAttachment(value: unknown): boolean {
  const file = Array.isArray(value) ? value[0] : null;
  if (!file || typeof file !== "object") return false;
  const url = (file as { downloadUrl?: unknown; DownloadUrl?: unknown }).downloadUrl;
  const alt = (file as { DownloadUrl?: unknown }).DownloadUrl;
  return (typeof url === "string" && url.length > 0) || (typeof alt === "string" && alt.length > 0);
}

export async function loadPublishedHonors(): Promise<HonorPageRecord[]> {
  const rows = await db.select().from(adventurerHonors).where(eq(adventurerHonors.published, true));
  const honors: HonorPageRecord[] = [];

  for (const row of rows) {
    const category = categoryId(row.category);
    if (!category) continue;
    const requirementsHtml = sanitizeHonorHtml(row.requirementsHtml);
    const answers = splitAnswerHtml(row.answersHtml);
    const nameEn = row.nameEn.trim();
    const note = normalizeAnswerSourceNote(row.answerSourceNote, row.answerSource);
    honors.push({
      id: row.id,
      code: row.code,
      nameZh: row.nameZh,
      nameEn: nameEn || undefined,
      aliases: aliasesOf(row.aliases),
      category,
      status: statusId(row.status),
      answerSource: answerSourceId(row.answerSource),
      answerSourceNote: note,
      requirementsHtml,
      answerPrefaceHtml: answers.prefaceHtml,
      answers: answers.answers,
      searchText: [
        row.code,
        row.nameZh,
        nameEn,
        ...aliasesOf(row.aliases),
        htmlToText(requirementsHtml),
        htmlToText(answers.prefaceHtml),
        ...answers.answers.map((answer) => htmlToText(answer.html)),
      ].join(" "),
      badgeUrl: row.badgeKey ? `/api/adventurer-honors/${row.id}/badge` : undefined,
      docxUrl: row.hasDocx ? `/api/adventurer-honors/${row.id}/file/docx` : undefined,
      pdfZhUrl: row.hasZhPdf ? `/api/adventurer-honors/${row.id}/file/zh` : undefined,
      pdfEnUrl: row.hasEnPdf ? `/api/adventurer-honors/${row.id}/file/en` : undefined,
      canvaViewUrl: row.canvaDesignId ? `/api/adventurer-honors/${row.id}/canva/view` : undefined,
      canvaPdfUrl: row.canvaDesignId ? `/api/adventurer-honors/${row.id}/canva/pdf` : undefined,
    });
  }

  return honors;
}

export async function loadHonorHandbooks(): Promise<HonorHandbooks> {
  try {
    const row = await getWorksheetRow(HANDBOOK_WORKSHEET_ID, HANDBOOK_ROW_ID);
    if (!row) return { zh: false, en: false };
    return {
      zh: hasAttachment(row[HANDBOOK_FIELDS.zh]),
      en: hasAttachment(row[HANDBOOK_FIELDS.en]),
    };
  } catch {
    return { zh: false, en: false };
  }
}

export async function publishedHonorFile(id: string) {
  const [row] = await db
    .select()
    .from(adventurerHonors)
    .where(and(eq(adventurerHonors.id, id), eq(adventurerHonors.published, true)));
  return row ?? null;
}
