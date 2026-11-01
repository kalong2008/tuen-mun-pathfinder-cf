import { env } from "void/env";

const NOCOLY_API = "https://www.nocoly.com/api/v3";
const NOTICES_WORKSHEET_ID = "69ca017def0b95ca9b93c7a1";

const PDF_SLOTS = {
  pathfinder: "6ad5f958fe0c0b51fb8d8797",
  adventurer: "6ad5f958fe0c0b51fb8d8798",
} as const;

export type PdfSlot = keyof typeof PDF_SLOTS;

export function isPdfSlot(value: string): value is PdfSlot {
  return value === "pathfinder" || value === "adventurer";
}

function inlinePdfDisposition(filename: string): string {
  const safeName = filename.trim() || "notice.pdf";
  const fallback = safeName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
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
    "notice.pdf";
  return { url, filename };
}

export async function fetchNoticePdf(id: string, slot: PdfSlot): Promise<Response> {
  const headers = new Headers();
  headers.set("HAP-Appkey", env.NOCOLY_APP_KEY);
  headers.set("HAP-Sign", env.NOCOLY_SIGN);

  let rowResponse: Response;
  try {
    rowResponse = await fetch(`${NOCOLY_API}/app/worksheets/${NOTICES_WORKSHEET_ID}/rows/${id}`, {
      headers,
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }

  const payload = (await rowResponse.json()) as { success?: boolean; error_msg?: string; data?: unknown };
  if (!rowResponse.ok || payload.success === false) {
    return Response.json({ error: payload.error_msg || "Failed to fetch PDF" }, { status: 502 });
  }
  const data = payload.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const file = attachmentDownload((data as Record<string, unknown>)[PDF_SLOTS[slot]]);
  if (!file) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const pdfResponse = await fetch(file.url, { cache: "no-store" });
  if (!pdfResponse.ok || !pdfResponse.body) {
    return Response.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }

  return new Response(pdfResponse.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inlinePdfDisposition(file.filename),
      "Cache-Control": "no-store",
    },
  });
}
