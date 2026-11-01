import { env } from "void/env";

const NOCOLY_API = "https://www.nocoly.com/api/v3";

type NocolyPayload = {
  success?: boolean;
  error_msg?: string;
  data?: unknown;
};

async function nocolyRequest(path: string, init?: RequestInit): Promise<NocolyPayload> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("HAP-Appkey", env.NOCOLY_APP_KEY);
  headers.set("HAP-Sign", env.NOCOLY_SIGN);

  let response: Response;
  try {
    response = await fetch(`${NOCOLY_API}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("Nocoly request failed.");
  }

  const payload = (await response.json()) as NocolyPayload;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error_msg || "Nocoly request failed.");
  }
  return payload;
}

export async function listWorksheetRows(worksheetId: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let pageIndex = 1;

  while (pageIndex <= 20) {
    const payload = await nocolyRequest(`/app/worksheets/${worksheetId}/rows/list`, {
      method: "POST",
      body: JSON.stringify({
        pageSize: 200,
        pageIndex,
        includeTotalCount: true,
      }),
    });
    const data = payload.data;
    const pageRows =
      data && typeof data === "object" && Array.isArray((data as { rows?: unknown }).rows)
        ? (data as { rows: Record<string, unknown>[] }).rows
        : [];
    rows.push(...pageRows);
    const total =
      data && typeof data === "object" && typeof (data as { total?: unknown }).total === "number"
        ? (data as { total: number }).total
        : rows.length;
    if (pageRows.length === 0 || rows.length >= total) break;
    pageIndex += 1;
  }

  return rows;
}
