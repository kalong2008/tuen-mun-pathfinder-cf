import { env } from "void/env";
import { storage } from "void/storage";
import {
  HANDBOOK_FIELDS,
  HANDBOOK_ROW_ID,
  HANDBOOK_WORKSHEET_ID,
  HONOR_BADGE_FIELD,
  HONOR_FILE_FIELDS,
  HONORS_WORKSHEET_ID,
} from "./adventurer-honors";
import { publishedHonorFile } from "./load-adventurer-honors";
import { getWorksheetRow } from "./nocoly";
import { isCurrentUserAdmin } from "./require-admin";

export type HonorFileSlot = keyof typeof HONOR_FILE_FIELDS;
export type HandbookSlot = keyof typeof HANDBOOK_FIELDS;

export function isHonorFileSlot(value: string): value is HonorFileSlot {
  return value === "docx" || value === "zh" || value === "en";
}

export function isHandbookSlot(value: string): value is HandbookSlot {
  return value === "zh" || value === "en";
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function attachmentDownload(value: unknown): { url: string; filename: string } | null {
  const file = Array.isArray(value) ? value[0] : null;
  if (!file || typeof file !== "object") return null;
  const record = file as Record<string, unknown>;
  const url = record.DownloadUrl ?? record.downloadUrl;
  if (typeof url !== "string" || !url) return null;
  const filename =
    textValue(record.original_file_name) ||
    textValue(record.originalFilename) ||
    textValue(record.fileName) ||
    "file";
  return { url, filename };
}

function contentDisposition(inline: boolean, filename: string): string {
  const safeName = filename.trim() || (inline ? "honor.pdf" : "honor.docx");
  const fallback = safeName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

function contentType(filename: string, inline: boolean): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pdf":
      return "application/pdf";
    default:
      return inline ? "application/pdf" : "application/octet-stream";
  }
}

async function denyUnlessAdmin(): Promise<Response | null> {
  if (await isCurrentUserAdmin()) return null;
  return Response.json({ error: "Not found" }, { status: 404 });
}

async function streamAttachment(file: { url: string; filename: string }, inline: boolean): Promise<Response> {
  const headers = new Headers();
  headers.set("HAP-Appkey", env.NOCOLY_APP_KEY);
  headers.set("HAP-Sign", env.NOCOLY_SIGN);
  const response = await fetch(file.url, { headers, cache: "no-store" });
  if (!response.ok || !response.body) {
    return Response.json({ error: "Failed to fetch file" }, { status: 502 });
  }
  return new Response(response.body, {
    headers: {
      "Content-Type": contentType(file.filename, inline),
      "Content-Disposition": contentDisposition(inline, file.filename),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function fetchHonorBadge(id: string): Promise<Response> {
  const row = await publishedHonorFile(id);
  if (!row?.badgeKey.startsWith("adventurer-honors/")) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const object = await storage.get(row.badgeKey);
  if (object) {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "private, max-age=86400");
    headers.set("X-Content-Type-Options", "nosniff");
    if (!headers.has("Content-Type")) headers.set("Content-Type", "image/png");
    return new Response(object.body, { headers });
  }

  let source: Record<string, unknown> | null;
  try {
    source = await getWorksheetRow(HONORS_WORKSHEET_ID, id);
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const file = source ? attachmentDownload(source[HONOR_BADGE_FIELD]) : null;
  if (!file) return Response.json({ error: "Not found" }, { status: 404 });
  const downloaded = await fetch(file.url, { cache: "no-store" });
  if (!downloaded.ok) return Response.json({ error: "Not found" }, { status: 404 });
  const bytes = await downloaded.arrayBuffer();
  const contentType = downloaded.headers.get("Content-Type") || contentTypeForBadge(file.filename);
  await storage.put(row.badgeKey, bytes, { httpMetadata: { contentType } });
  return new Response(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function contentTypeForBadge(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
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

export async function fetchHonorFile(id: string, slot: HonorFileSlot): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  const row = await publishedHonorFile(id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  const available = fileAvailable(row, slot);
  if (!available) return Response.json({ error: "Not found" }, { status: 404 });

  let source: Record<string, unknown> | null;
  try {
    source = await getWorksheetRow(HONORS_WORKSHEET_ID, id);
  } catch {
    return Response.json({ error: "Failed to fetch file" }, { status: 502 });
  }
  const file = source ? attachmentDownload(source[HONOR_FILE_FIELDS[slot]]) : null;
  if (!file) return Response.json({ error: "Not found" }, { status: 404 });
  return streamAttachment(file, slot !== "docx");
}

export async function fetchHonorHandbook(slot: HandbookSlot): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  let source: Record<string, unknown> | null;
  try {
    source = await getWorksheetRow(HANDBOOK_WORKSHEET_ID, HANDBOOK_ROW_ID);
  } catch {
    return Response.json({ error: "Failed to fetch file" }, { status: 502 });
  }
  const file = source ? attachmentDownload(source[HANDBOOK_FIELDS[slot]]) : null;
  if (!file) return Response.json({ error: "Not found" }, { status: 404 });
  return streamAttachment(file, true);
}

function fileAvailable(
  row: { hasDocx: boolean; hasZhPdf: boolean; hasEnPdf: boolean },
  slot: HonorFileSlot,
): boolean {
  switch (slot) {
    case "docx":
      return row.hasDocx;
    case "zh":
      return row.hasZhPdf;
    case "en":
      return row.hasEnPdf;
    default: {
      const unhandled: never = slot;
      return unhandled;
    }
  }
}
