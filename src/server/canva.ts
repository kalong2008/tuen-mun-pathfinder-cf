import { siteSettings } from "@schema";
import { and, db, eq } from "void/db";
import { env } from "void/env";
import { publishedHonorFile } from "./load-adventurer-honors";
import { isCurrentUserAdmin } from "./require-admin";

const CANVA_REDIRECT_URI = "https://tuenmunpathfinder.com/api/canva/oauth/callback";
const CANVA_SCOPES = "design:meta:read design:content:read";
const CANVA_AUTHORIZE = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN = "https://api.canva.com/rest/v1/oauth/token";
const CANVA_API = "https://api.canva.com/rest/v1";

const REFRESH_KEY = "canva.refreshToken";
const ACCESS_KEY = "canva.accessToken";
const EXPIRES_KEY = "canva.accessExpiresAt";
const PENDING_KEY = "canva.oauth.pending";

const RETURN_ORIGINS = new Set([
  "https://tuenmunpathfinder.com",
  "https://www.tuenmunpathfinder.com",
]);

class CanvaNotConfiguredError extends Error {
  constructor() {
    super("尚未設定 Canva client secret。");
    this.name = "CanvaNotConfiguredError";
  }
}

class CanvaNotConnectedError extends Error {
  constructor() {
    super("尚未連接 Canva。");
    this.name = "CanvaNotConnectedError";
  }
}

class CanvaRequestError extends Error {
  readonly code: string;

  constructor(message: string, code = "") {
    super(message);
    this.name = "CanvaRequestError";
    this.code = code;
  }
}

type CanvaToken = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type PendingOAuth = {
  state: string;
  verifier: string;
  expiresAt: number;
  returnOrigin: string;
};

type ExportJob = {
  id: string;
  status: "in_progress" | "success" | "failed" | "unknown";
  urls: string[];
};

function canvaSecret(): string {
  const secret = env.CANVA_CLIENT_SECRET;
  if (!secret?.trim()) throw new CanvaNotConfiguredError();
  return secret;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlDocument(body: string): string {
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="color-scheme" content="light"><title>Canva</title><body style="margin:2rem;font-family:sans-serif;background:#fff;color:#111">${body}</body></html>`;
}

function htmlPage(message: string, status: number, link?: { href: string; label: string }): Response {
  const extra = link
    ? ` <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
    : "";
  const html = htmlDocument(`<p>${escapeHtml(message)}${extra}</p>`);
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function canvaErrorResponse(error: unknown): Response {
  if (error instanceof CanvaNotConfiguredError) return htmlPage(error.message, 503);
  if (error instanceof CanvaNotConnectedError) {
    return htmlPage(error.message, 503, { href: "/api/canva/oauth/start", label: "連接 Canva" });
  }
  if (error instanceof CanvaRequestError) {
    const reconnect = error.code === "invalid_grant" || error.code === "invalid_client";
    return htmlPage(
      error.message,
      502,
      reconnect ? { href: "/api/canva/oauth/start", label: "連接 Canva" } : undefined,
    );
  }
  return htmlPage("Canva 請求失敗。", 502);
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function basicAuth(secret: string): string {
  const bytes = new TextEncoder().encode(`${env.CANVA_CLIENT_ID}:${secret}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function returnOrigin(request: Request): string {
  const origin = new URL(request.url).origin;
  if (RETURN_ORIGINS.has(origin)) return origin;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return origin;
  return "https://tuenmunpathfinder.com";
}

function allowedReturnOrigin(origin: string, request: Request): string {
  if (RETURN_ORIGINS.has(origin)) return origin;
  const host = new URL(request.url).origin;
  if (
    (host.startsWith("http://localhost:") || host.startsWith("http://127.0.0.1:")) &&
    origin === host
  ) {
    return origin;
  }
  return "https://tuenmunpathfinder.com";
}

function allowedCanvaUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "canva.com" && !url.hostname.endsWith(".canva.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function readSetting(key: string): Promise<string> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return row?.value ?? "";
}

async function writeSetting(key: string, value: string) {
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value },
    });
}

async function deleteSetting(key: string) {
  await db.delete(siteSettings).where(eq(siteSettings.key, key));
}

async function deleteSettingIfValue(key: string, value: string) {
  await db.delete(siteSettings).where(and(eq(siteSettings.key, key), eq(siteSettings.value, value)));
}

function pendingFrom(value: string): PendingOAuth | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.state !== "string" || typeof record.verifier !== "string") return null;
    if (typeof record.expiresAt !== "number" || typeof record.returnOrigin !== "string") return null;
    return {
      state: record.state,
      verifier: record.verifier,
      expiresAt: record.expiresAt,
      returnOrigin: record.returnOrigin,
    };
  } catch {
    return null;
  }
}

function positiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function tokenFrom(value: unknown): CanvaToken | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.access_token !== "string" || !record.access_token) return null;
  const expiresIn = positiveNumber(record.expires_in);
  if (!expiresIn) return null;
  return {
    accessToken: record.access_token,
    refreshToken: typeof record.refresh_token === "string" ? record.refresh_token : "",
    expiresIn,
  };
}

function canvaErrorCode(value: unknown): string {
  if (!value || typeof value !== "object") return "unknown";
  const record = value as Record<string, unknown>;
  if (typeof record.code === "string" && record.code) return record.code;
  if (typeof record.error === "string" && record.error) return record.error;
  return "unknown";
}

function redirectTo(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "cache-control": "no-store",
    },
  });
}

async function requestToken(body: URLSearchParams, previousRefresh = ""): Promise<CanvaToken> {
  const secret = canvaSecret();
  let response: Response;
  try {
    response = await fetch(CANVA_TOKEN, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(secret)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
  } catch {
    throw new CanvaRequestError("無法連接 Canva。");
  }
  const payload = await response.json().catch(() => null);
  const token = tokenFrom(payload);
  if (!response.ok || !token) {
    const code = canvaErrorCode(payload);
    console.error(`Canva token exchange failed: ${response.status} ${code}`);
    throw new CanvaRequestError("Canva 授權失敗，請再連接一次。", code);
  }
  const refreshToken = token.refreshToken || previousRefresh;
  if (!refreshToken) throw new CanvaRequestError("Canva 授權失敗，請再連接一次。");
  await writeSetting(REFRESH_KEY, refreshToken);
  await writeSetting(ACCESS_KEY, token.accessToken);
  await writeSetting(EXPIRES_KEY, String(Date.now() + token.expiresIn * 1000));
  return { ...token, refreshToken };
}

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenOnce().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function refreshAccessTokenOnce(): Promise<string> {
  const refreshToken = await readSetting(REFRESH_KEY);
  if (!refreshToken) throw new CanvaNotConnectedError();
  try {
    const token = await requestToken(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      refreshToken,
    );
    return token.accessToken;
  } catch (error) {
    const [currentRefresh, access, expires] = await Promise.all([
      readSetting(REFRESH_KEY),
      readSetting(ACCESS_KEY),
      readSetting(EXPIRES_KEY),
    ]);
    const expiry = Number(expires);
    if (currentRefresh && currentRefresh !== refreshToken && access && expiry > Date.now() + 60_000) {
      return access;
    }
    if (
      error instanceof CanvaRequestError &&
      (error.code === "invalid_grant" || error.code === "invalid_client") &&
      currentRefresh === refreshToken
    ) {
      await deleteSettingIfValue(REFRESH_KEY, refreshToken);
      if (!(await readSetting(REFRESH_KEY))) {
        await deleteSetting(ACCESS_KEY);
        await deleteSetting(EXPIRES_KEY);
      }
    }
    throw error;
  }
}

async function accessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const [access, expires] = await Promise.all([readSetting(ACCESS_KEY), readSetting(EXPIRES_KEY)]);
    const expiry = Number(expires);
    if (access && (!expires || !Number.isFinite(expiry) || expiry > Date.now() + 60_000)) return access;
  }
  return refreshAccessToken();
}

async function canvaFetch(path: string, init?: RequestInit, retry = true): Promise<Response> {
  const token = await accessToken(false);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${CANVA_API}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new CanvaRequestError("無法連接 Canva。");
  }
  if (response.status === 401 && retry) {
    await response.body?.cancel();
    await accessToken(true);
    return canvaFetch(path, init, false);
  }
  return response;
}

function jobFrom(value: unknown): ExportJob | null {
  if (!value || typeof value !== "object") return null;
  const job = (value as { job?: unknown }).job;
  if (!job || typeof job !== "object") return null;
  const record = job as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id) return null;
  const status = record.status;
  const known = status === "in_progress" || status === "success" || status === "failed" ? status : "unknown";
  const urls = Array.isArray(record.urls)
    ? record.urls.flatMap((url) => {
        if (typeof url !== "string") return [];
        const allowed = allowedCanvaUrl(url);
        return allowed ? [allowed] : [];
      })
    : [];
  return { id: record.id, status: known, urls };
}

async function exportPdf(designId: string): Promise<string[]> {
  const createdResponse = await canvaFetch("/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ design_id: designId, format: { type: "pdf" } }),
  });
  const created = jobFrom(await createdResponse.json().catch(() => null));
  if (!createdResponse.ok || !created) throw new CanvaRequestError("無法匯出 Canva PDF。");

  let job = created;
  for (let attempt = 0; attempt < 20 && job.status !== "success" && job.status !== "failed"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await canvaFetch(`/exports/${encodeURIComponent(job.id)}`);
    const next = jobFrom(await response.json().catch(() => null));
    if (!response.ok || !next) throw new CanvaRequestError("無法匯出 Canva PDF。");
    job = next;
  }

  if (job.status === "failed") throw new CanvaRequestError("無法匯出 Canva PDF。");
  if (job.status !== "success") throw new CanvaRequestError("Canva PDF 仍在匯出，請再試一次。");
  if (job.urls.length === 0) throw new CanvaRequestError("無法匯出 Canva PDF。");
  return job.urls;
}

function pdfResponse(urls: string[]): Response {
  const first = urls[0];
  if (urls.length === 1 && first) return redirectTo(first);
  const links = urls
    .map((url, index) => `<p><a href="${escapeHtml(url)}">下載 PDF ${index + 1}</a></p>`)
    .join("");
  return new Response(htmlDocument(links), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function publishedDesignId(id: string): Promise<string | null> {
  const honor = await publishedHonorFile(id);
  if (!honor?.canvaDesignId) return null;
  return honor.canvaDesignId;
}

export async function isCanvaConnected(): Promise<boolean> {
  return (await readSetting(REFRESH_KEY)).length > 0;
}

export async function startCanvaOAuth(request: Request): Promise<Response> {
  if (!(await isCurrentUserAdmin())) return htmlPage("僅限管理員連接 Canva。", 404);
  try {
    canvaSecret();
  } catch (error) {
    return canvaErrorResponse(error);
  }

  const state = randomToken();
  const verifier = randomToken();
  const pending: PendingOAuth = {
    state,
    verifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
    returnOrigin: returnOrigin(request),
  };
  await writeSetting(PENDING_KEY, JSON.stringify(pending));

  const url = new URL(CANVA_AUTHORIZE);
  url.searchParams.set("code_challenge", await codeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.CANVA_CLIENT_ID);
  url.searchParams.set("redirect_uri", CANVA_REDIRECT_URI);
  url.searchParams.set("scope", CANVA_SCOPES);
  url.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "cache-control": "no-store",
    },
  });
}

export async function finishCanvaOAuth(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error") ?? "";
  const pending = pendingFrom(await readSetting(PENDING_KEY));
  if (!pending || pending.expiresAt < Date.now() || !safeEqual(pending.state, state)) {
    return htmlPage("Canva 授權已失效，請再連接一次。", 400, {
      href: "/api/canva/oauth/start",
      label: "連接 Canva",
    });
  }
  await deleteSetting(PENDING_KEY);
  const destination = `${allowedReturnOrigin(pending.returnOrigin, request)}/adventurer-honors`;
  if (oauthError || !code) {
    return htmlPage("Canva 授權已取消。", 400, { href: destination, label: "返回榮譽證" });
  }

  try {
    await requestToken(
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: pending.verifier,
        redirect_uri: CANVA_REDIRECT_URI,
        client_id: env.CANVA_CLIENT_ID,
      }),
    );
  } catch (error) {
    return canvaErrorResponse(error);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      "cache-control": "no-store",
    },
  });
}

export async function downloadCanvaPdf(id: string, access: "admin" | "app" = "admin"): Promise<Response> {
  if (access === "admin" && !(await isCurrentUserAdmin())) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const designId = await publishedDesignId(id);
  if (!designId) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    return pdfResponse(await exportPdf(designId));
  } catch (error) {
    return canvaErrorResponse(error);
  }
}
