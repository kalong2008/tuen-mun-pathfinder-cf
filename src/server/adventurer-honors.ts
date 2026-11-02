import { adventurerHonors } from "@schema";
import { db } from "void/db";
import { env } from "void/env";
import { storage } from "void/storage";

export const HONORS_WORKSHEET_ID = "6ae7d211cf693fce891c5256";
export const HONORS_VIEW_ID = "6ae7d211cf693fce891c525a";

export const HANDBOOK_WORKSHEET_ID = "6ae7d454021d1ae0606e61be";
export const HANDBOOK_ROW_ID = "941d4f78-008c-4393-8b82-98bd4f61218a";

export const HANDBOOK_FIELDS = {
  zh: "6ae7d454021d1ae0606e61c1",
  en: "6ae7d473fe0c0b51fb8fb685",
} as const;

const FIELDS = {
  code: "6ae7d3de8b55cec057237e39",
  nameZh: "6ae7d3de8b55cec057237e3a",
  nameEn: "6ae7d3de8b55cec057237e3b",
  aliases: "6ae7d3de8b55cec057237e3c",
  category: "6ae7d3de8b55cec057237e3d",
  status: "6ae7d3de8b55cec057237e3e",
  answerSource: "6ae7d3de8b55cec057237e3f",
  answerSourceNote: "6ae7d3de8b55cec057237e40",
  requirementsMd: "6ae7d3de8b55cec057237e41",
  answersMd: "6ae7d3de8b55cec057237e42",
  published: "6ae7d3de8b55cec057237e43",
  requirementsHtml: "6ae7d3de8b55cec057237e44",
  answersHtml: "6ae7d4bd8b55cec057237e65",
  badge: "6ae7d44efe0c0b51fb8fb679",
  docx: "6ae7d211cf693fce891c5259",
  pdfZh: "6ae7d44efe0c0b51fb8fb67a",
  pdfEn: "6ae7d44efe0c0b51fb8fb67b",
} as const;

export const HONOR_FILE_FIELDS = {
  docx: FIELDS.docx,
  zh: FIELDS.pdfZh,
  en: FIELDS.pdfEn,
} as const;

export const HONOR_BADGE_FIELD = FIELDS.badge;

const BADGE_PREFIX = "adventurer-honors/";
const BADGE_UPLOAD_BATCH = 24;

export type HonorSyncRow = {
  id: string;
  code: string;
  nameZh: string;
  nameEn: string;
  aliases: string;
  category: string;
  status: string;
  answerSource: string;
  answerSourceNote: string;
  published: boolean;
  requirementsMd: string;
  answersMd: string;
  requirementsHtml: string;
  answersHtml: string;
  badgeKey: string;
  badgeSource: string;
  hasDocx: boolean;
  hasZhPdf: boolean;
  hasEnPdf: boolean;
};

type BadgeUpload = {
  code: string;
  url: string;
  source: string;
  contentType: string;
  key: string;
};

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function optionLabel(value: unknown): string {
  if (!Array.isArray(value)) return "";
  const first = value[0];
  if (!first || typeof first !== "object" || !("value" in first)) return "";
  const label = (first as { value?: unknown }).value;
  return typeof label === "string" ? label : "";
}

function rowId(row: Record<string, unknown>): string {
  const value = row.rowId ?? row.rowid ?? row._id;
  return typeof value === "string" ? value : "";
}

function attachment(value: unknown): { url: string; name: string } | null {
  const file = Array.isArray(value) ? value[0] : null;
  if (!file || typeof file !== "object") return null;
  const record = file as Record<string, unknown>;
  const url = textValue(record.downloadUrl) || textValue(record.DownloadUrl);
  if (!url) return null;
  const name =
    textValue(record.fileName) ||
    textValue(record.original_file_name) ||
    textValue(record.originalFilename) ||
    "file";
  return { url, name };
}

function contentTypeFor(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "png":
      return "image/png";
    default:
      return "image/png";
  }
}

function badgeObjectKey(code: string, name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return `${BADGE_PREFIX}${code}.jpg`;
    case "webp":
      return `${BADGE_PREFIX}${code}.webp`;
    case "gif":
      return `${BADGE_PREFIX}${code}.gif`;
    case "png":
      return `${BADGE_PREFIX}${code}.png`;
    default:
      return `${BADGE_PREFIX}${code}.png`;
  }
}

function badgeSource(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function parseHonorRows(rows: Record<string, unknown>[]): {
  honors: HonorSyncRow[];
  badges: BadgeUpload[];
} {
  const honors: HonorSyncRow[] = [];
  const badges: BadgeUpload[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const id = rowId(row);
    const code = textValue(row[FIELDS.code]).toUpperCase();
    const nameZh = textValue(row[FIELDS.nameZh]);
    if (!id || !code || !nameZh || seen.has(code)) continue;
    seen.add(code);
    const badge = attachment(row[FIELDS.badge]);
    const source = badge ? badgeSource(badge.url) : "";
    const key = badge ? badgeObjectKey(code, badge.name) : "";
    honors.push({
      id,
      code,
      nameZh,
      nameEn: textValue(row[FIELDS.nameEn]),
      aliases: textValue(row[FIELDS.aliases]),
      category: optionLabel(row[FIELDS.category]),
      status: optionLabel(row[FIELDS.status]),
      answerSource: optionLabel(row[FIELDS.answerSource]),
      answerSourceNote: textValue(row[FIELDS.answerSourceNote]),
      published: optionLabel(row[FIELDS.published]) === "是",
      requirementsMd: textValue(row[FIELDS.requirementsMd]),
      answersMd: textValue(row[FIELDS.answersMd]),
      requirementsHtml: textValue(row[FIELDS.requirementsHtml]),
      answersHtml: textValue(row[FIELDS.answersHtml]),
      badgeKey: key,
      badgeSource: source,
      hasDocx: attachment(row[FIELDS.docx]) !== null,
      hasZhPdf: attachment(row[FIELDS.pdfZh]) !== null,
      hasEnPdf: attachment(row[FIELDS.pdfEn]) !== null,
    });
    if (badge && key) {
      badges.push({
        code,
        url: badge.url,
        source,
        contentType: contentTypeFor(badge.name),
        key,
      });
    }
  }

  return { honors, badges };
}

async function mapPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current]);
    }
  });
  await Promise.all(runners);
}

export async function uploadChangedHonorBadges(
  honors: HonorSyncRow[],
  badges: BadgeUpload[],
): Promise<{ uploaded: number; remaining: number }> {
  const current = await db
    .select({ code: adventurerHonors.code, badgeSource: adventurerHonors.badgeSource })
    .from(adventurerHonors);
  const previous = new Map(current.map((row) => [row.code, row.badgeSource]));
  const pending = badges.filter((badge) => previous.get(badge.code) !== badge.source);
  const batch = pending.slice(0, BADGE_UPLOAD_BATCH);
  const headers = new Headers();
  headers.set("HAP-Appkey", env.NOCOLY_APP_KEY);
  headers.set("HAP-Sign", env.NOCOLY_SIGN);
  const uploaded = new Set<string>();

  try {
    await mapPool(batch, 4, async (badge) => {
      let response: Response;
      try {
        response = await fetch(badge.url, { headers, cache: "no-store" });
      } catch (error) {
        if (isSubrequestLimit(error)) throw error;
        throw new Error(`Failed to download honor badge ${badge.code}.`);
      }
      if (!response.ok) {
        throw new Error(`Failed to download honor badge ${badge.code}.`);
      }
      await storage.put(badge.key, await response.arrayBuffer(), {
        httpMetadata: { contentType: badge.contentType },
      });
      uploaded.add(badge.code);
    });
  } catch (error) {
    if (!isSubrequestLimit(error)) throw error;
  }

  const badgeByCode = new Map(badges.map((badge) => [badge.code, badge]));
  for (const honor of honors) {
    const badge = badgeByCode.get(honor.code);
    if (!badge) {
      honor.badgeKey = "";
      honor.badgeSource = "";
      continue;
    }
    const stored = previous.get(honor.code) ?? "";
    honor.badgeSource = stored === badge.source || uploaded.has(honor.code) ? badge.source : stored;
  }

  return { uploaded: uploaded.size, remaining: pending.length - uploaded.size };
}

function isSubrequestLimit(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("subrequest");
}

export async function removeStaleHonorBadges(keys: Set<string>) {
  let cursor: string | undefined;
  do {
    const listed = await storage.list({ prefix: BADGE_PREFIX, cursor });
    const stale = listed.objects.filter((object) => !keys.has(object.key)).map((object) => object.key);
    if (stale.length > 0) await storage.delete(stale);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
}
