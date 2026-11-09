import { siteSettings } from "@schema";
import { db, eq } from "void/db";
import { env } from "void/env";

const TOKEN_URL = "https://secure.soundcloud.com/oauth/token";
const API = "https://api.soundcloud.com";
const TOKEN_KEY = "soundcloud.token";
const TOKEN_SKEW_MS = 60_000;

const STREAM_KEYS = ["hls_aac_160_url", "hls_mp3_128_url", "http_mp3_128_url", "hls_aac_96_url"] as const;

export class SoundCloudNotConfiguredError extends Error {
  constructor() {
    super("尚未設定 SoundCloud client secret。");
    this.name = "SoundCloudNotConfiguredError";
  }
}

export class SoundCloudRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`SoundCloud 請求失敗（${status}）。`);
    this.name = "SoundCloudRequestError";
    this.status = status;
  }
}

type StoredToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type Transcoding = {
  url: string;
  snipped: boolean;
  protocol: string;
  mimeType: string;
};

export type DevotionAudio = {
  url: string;
  author: string;
  permalink: string;
};

let memoryToken: StoredToken | null = null;
let pendingToken: Promise<StoredToken> | null = null;

function credentials(): { id: string; secret: string } {
  const id = env.SOUNDCLOUD_CLIENT_ID?.trim() ?? "";
  const secret = env.SOUNDCLOUD_CLIENT_SECRET?.trim() ?? "";
  if (!id || !secret) throw new SoundCloudNotConfiguredError();
  return { id, secret };
}

function basicAuth(id: string, secret: string): string {
  const bytes = new TextEncoder().encode(`${id}:${secret}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function storedToken(value: unknown): StoredToken | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.accessToken !== "string" || !record.accessToken) return null;
  if (typeof record.refreshToken !== "string") return null;
  if (typeof record.expiresAt !== "number") return null;
  return {
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    expiresAt: record.expiresAt,
  };
}

function tokenFromResponse(body: unknown, now: number): StoredToken | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.access_token !== "string" || !record.access_token) return null;
  const expiresIn = typeof record.expires_in === "number" ? record.expires_in : 3600;
  return {
    accessToken: record.access_token,
    refreshToken: typeof record.refresh_token === "string" ? record.refresh_token : "",
    expiresAt: now + expiresIn * 1000,
  };
}

function tokenIsFresh(token: StoredToken, now = Date.now()): boolean {
  return token.expiresAt - TOKEN_SKEW_MS > now;
}

async function readStoredToken(): Promise<StoredToken | null> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, TOKEN_KEY))
    .limit(1);
  if (!row?.value) return null;
  try {
    return storedToken(JSON.parse(row.value));
  } catch {
    return null;
  }
}

async function writeStoredToken(token: StoredToken) {
  const value = JSON.stringify(token);
  await db
    .insert(siteSettings)
    .values({ key: TOKEN_KEY, value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value },
    });
  memoryToken = token;
}

async function tokenRequest(body: URLSearchParams, basic: { id: string; secret: string } | null): Promise<StoredToken> {
  const headers: Record<string, string> = {
    accept: "application/json; charset=utf-8",
    "content-type": "application/x-www-form-urlencoded",
  };
  if (basic) headers.authorization = `Basic ${basicAuth(basic.id, basic.secret)}`;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers,
    body,
  });
  if (!response.ok) throw new SoundCloudRequestError(response.status);
  const token = tokenFromResponse(await response.json(), Date.now());
  if (!token) throw new SoundCloudRequestError(502);
  await writeStoredToken(token);
  return token;
}

async function clientCredentialsToken(): Promise<StoredToken> {
  const { id, secret } = credentials();
  return tokenRequest(new URLSearchParams({ grant_type: "client_credentials" }), { id, secret });
}

async function refreshStoredToken(current: StoredToken): Promise<StoredToken> {
  const { id, secret } = credentials();
  if (!current.refreshToken) return clientCredentialsToken();
  try {
    return await tokenRequest(
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: id,
        client_secret: secret,
        refresh_token: current.refreshToken,
      }),
      null,
    );
  } catch (error) {
    const latest = await readStoredToken();
    if (latest && tokenIsFresh(latest) && latest.accessToken !== current.accessToken) return latest;
    if (error instanceof SoundCloudRequestError && error.status === 401) return clientCredentialsToken();
    throw error;
  }
}

async function loadToken(): Promise<StoredToken> {
  if (memoryToken && tokenIsFresh(memoryToken)) return memoryToken;
  const stored = await readStoredToken();
  if (stored && tokenIsFresh(stored)) {
    memoryToken = stored;
    return stored;
  }
  if (stored) return refreshStoredToken(stored);
  return clientCredentialsToken();
}

async function accessToken(): Promise<string> {
  if (!pendingToken) {
    pendingToken = loadToken().finally(() => {
      pendingToken = null;
    });
  }
  return (await pendingToken).accessToken;
}

function forgetToken() {
  memoryToken = null;
}

async function soundCloudJSON(url: string, token: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json; charset=utf-8",
      authorization: `OAuth ${token}`,
    },
  });
  if (response.status === 401) {
    forgetToken();
    throw new SoundCloudRequestError(401);
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new SoundCloudRequestError(response.status);
  return response.json();
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function directMediaURL(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname;
  const allowed =
    host === "sndcdn.com" ||
    host.endsWith(".sndcdn.com") ||
    host === "soundcloud.cloud" ||
    host.endsWith(".soundcloud.cloud") ||
    host === "soundcloud.com" ||
    host.endsWith(".soundcloud.com");
  if (!allowed) return null;
  if (host === "api.soundcloud.com" || host === "api-v2.soundcloud.com") return null;
  return url.toString();
}

export function preferredStreamURL(body: unknown): string | null {
  const candidate = streamCandidate(body);
  return candidate ? directMediaURL(candidate) : null;
}

function streamCandidate(body: unknown): string | null {
  const payload = record(body);
  if (!payload) return null;
  for (const key of STREAM_KEYS) {
    const value = payload[key];
    if (typeof value === "string" && value.startsWith("https://")) return value;
  }
  const nested = payload.url;
  if (typeof nested === "string" && nested.startsWith("https://")) return nested;
  return preferredTranscodingURL(body);
}

function transcodingList(body: unknown): Transcoding[] {
  const payload = record(body);
  const media = record(payload?.media);
  const list = media?.transcodings;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const entry = record(item);
    const format = record(entry?.format);
    if (typeof entry?.url !== "string") return [];
    return [
      {
        url: entry.url,
        snipped: entry.snipped === true,
        protocol: typeof format?.protocol === "string" ? format.protocol : "",
        mimeType: typeof format?.mime_type === "string" ? format.mime_type : "",
      },
    ];
  });
}

function transcodingRank(item: Transcoding): number {
  if (item.protocol === "hls" && item.mimeType.includes("mp4")) return 0;
  if (item.protocol === "progressive" && item.mimeType.includes("mpeg")) return 1;
  if (item.protocol === "hls" && item.mimeType.includes("mpeg")) return 2;
  if (item.mimeType.includes("opus")) return 9;
  return 5;
}

export function preferredTranscodingURL(body: unknown): string | null {
  const list = transcodingList(body);
  const full = list.filter((item) => !item.snipped);
  const pool = full.length > 0 ? full : list;
  const ranked = [...pool].sort((left, right) => transcodingRank(left) - transcodingRank(right));
  return ranked[0]?.url ?? null;
}

function credit(body: unknown): { author: string; permalink: string } {
  const payload = record(body);
  const user = record(payload?.user);
  const author = typeof user?.username === "string" && user.username.trim() ? user.username.trim() : "靈修廣播站";
  const permalink =
    typeof payload?.permalink_url === "string" && payload.permalink_url.startsWith("https://soundcloud.com/")
      ? payload.permalink_url
      : "https://soundcloud.com/mediahk";
  return { author, permalink };
}

function trackURL(trackID: string, suffix = ""): string {
  return `${API}/tracks/soundcloud:tracks:${trackID}${suffix}`;
}

async function openStream(candidate: string, token: string, hops = 0): Promise<string> {
  const direct = directMediaURL(candidate);
  if (direct) return direct;
  if (hops > 3) throw new SoundCloudRequestError(502);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new SoundCloudRequestError(502);
  }
  if (url.protocol !== "https:") throw new SoundCloudRequestError(502);
  const response = await fetch(url, {
    headers: {
      accept: "*/*",
      authorization: `OAuth ${token}`,
    },
    redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new SoundCloudRequestError(502);
    return openStream(new URL(location, url).toString(), token, hops + 1);
  }
  if (response.status === 401) {
    forgetToken();
    throw new SoundCloudRequestError(401);
  }
  if (!response.ok) throw new SoundCloudRequestError(response.status);
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    const nested = streamCandidate(await response.json());
    if (!nested || nested === candidate) throw new SoundCloudRequestError(502);
    return openStream(nested, token, hops + 1);
  }
  const finalURL = directMediaURL(response.url);
  if (finalURL) return finalURL;
  throw new SoundCloudRequestError(502);
}

async function mediaForTrack(trackID: string, token: string): Promise<DevotionAudio> {
  const [track, streams] = await Promise.all([
    soundCloudJSON(trackURL(trackID), token),
    soundCloudJSON(trackURL(trackID, "/streams"), token),
  ]);
  const candidate = streamCandidate(streams) ?? streamCandidate(track);
  if (!candidate) throw new SoundCloudRequestError(404);
  return { url: await openStream(candidate, token), ...credit(track) };
}

export async function soundCloudAudio(trackID: string): Promise<DevotionAudio> {
  if (!/^\d{1,20}$/.test(trackID)) throw new SoundCloudRequestError(400);
  try {
    return await mediaForTrack(trackID, await accessToken());
  } catch (error) {
    if (!(error instanceof SoundCloudRequestError) || error.status !== 401) throw error;
    return mediaForTrack(trackID, await accessToken());
  }
}
