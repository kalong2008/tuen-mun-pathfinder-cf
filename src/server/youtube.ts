import { env } from "void/env";

const PLAYLISTS = {
  minute: "PLHUHHJ0Srno6pUmDNeb5HVzT_NfDJk5u0",
  gleaning: "PLHUHHJ0Srno7GI1lhWv5QxkGDibPLvAwn",
  storm: "PLHUHHJ0Srno6YuU5ajSCZdMI1UUuUfwn3",
} as const;

export type YouTubeDevotionKey = keyof typeof PLAYLISTS;

const PAGE_LIMIT = 40;
const CACHE_SECONDS = 60 * 60;

export class YouTubeNotConfiguredError extends Error {
  constructor() {
    super("尚未設定 YouTube API key。");
    this.name = "YouTubeNotConfiguredError";
  }
}

export class YouTubeRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`YouTube 請求失敗（${status}）。`);
    this.name = "YouTubeRequestError";
    this.status = status;
  }
}

export type DevotionMinute = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
};

type PlaylistItem = {
  snippet?: {
    title?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
};

type PlaylistPage = {
  nextPageToken?: string;
  items?: PlaylistItem[];
};

function apiKey(): string {
  const key = env.YOUTUBE_API_KEY?.trim() ?? "";
  if (!key) throw new YouTubeNotConfiguredError();
  return key;
}

/** Newest video already published. Playlist order is not publish order. */
export function latestPlaylistVideo(items: PlaylistItem[], now = Date.now()): DevotionMinute | null {
  let latest: { video: DevotionMinute; published: number } | null = null;
  for (const item of items) {
    const videoId = item.contentDetails?.videoId?.trim() ?? "";
    const publishedAt = item.contentDetails?.videoPublishedAt?.trim() ?? "";
    const title = item.snippet?.title?.trim() ?? "";
    const published = Date.parse(publishedAt);
    if (!videoId || !title || !Number.isFinite(published) || published > now) continue;
    if (latest && published <= latest.published) continue;
    const thumbs = item.snippet?.thumbnails;
    const thumbnailUrl =
      thumbs?.high?.url ||
      thumbs?.medium?.url ||
      thumbs?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    latest = {
      published,
      video: {
        videoId,
        title,
        publishedAt,
        thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      },
    };
  }
  return latest?.video ?? null;
}

async function fetchPlaylist(playlistId: string, key: string): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken = "";
  for (let page = 0; page < PAGE_LIMIT; page += 1) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", key);
    url.searchParams.set(
      "fields",
      "nextPageToken,items(snippet(title,thumbnails(high(url),medium(url),default(url))),contentDetails(videoId,videoPublishedAt))",
    );
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url);
    if (!response.ok) throw new YouTubeRequestError(response.status);
    const body = (await response.json()) as PlaylistPage;
    items.push(...(body.items ?? []));
    pageToken = body.nextPageToken ?? "";
    if (!pageToken) break;
  }
  return items;
}

function cacheStore(): Cache | null {
  const cachesGlobal = (globalThis as { caches?: { default?: Cache } }).caches;
  return cachesGlobal?.default ?? null;
}

function cacheURL(playlistId: string): string {
  return `https://tuenmunpathfinder.com/internal/youtube-latest/${playlistId}`;
}

async function readCache(playlistId: string): Promise<DevotionMinute | null> {
  try {
    const response = await cacheStore()?.match(cacheURL(playlistId));
    if (!response) return null;
    const body = (await response.json()) as Partial<DevotionMinute>;
    if (!body.videoId || !body.title || !body.publishedAt || !body.thumbnailUrl || !body.url) return null;
    return {
      videoId: body.videoId,
      title: body.title,
      publishedAt: body.publishedAt,
      thumbnailUrl: body.thumbnailUrl,
      url: body.url,
    };
  } catch {
    return null;
  }
}

async function writeCache(playlistId: string, video: DevotionMinute) {
  try {
    await cacheStore()?.put(
      cacheURL(playlistId),
      Response.json(video, {
        headers: { "cache-control": `public, max-age=${CACHE_SECONDS}` },
      }),
    );
  } catch {
    return;
  }
}

export async function latestYouTubeDevotion(series: YouTubeDevotionKey): Promise<DevotionMinute> {
  const playlistId = PLAYLISTS[series];
  const cached = await readCache(playlistId);
  if (cached) return cached;
  const video = latestPlaylistVideo(await fetchPlaylist(playlistId, apiKey()));
  if (!video) throw new YouTubeRequestError(404);
  await writeCache(playlistId, video);
  return video;
}

export async function latestMinuteDevotion(): Promise<DevotionMinute> {
  return latestYouTubeDevotion("minute");
}

export async function latestYouTubeDevotions(): Promise<Partial<Record<YouTubeDevotionKey, DevotionMinute>>> {
  const entries = await Promise.all(
    (Object.keys(PLAYLISTS) as YouTubeDevotionKey[]).map(async (series) => {
      try {
        return [series, await latestYouTubeDevotion(series)] as const;
      } catch (error) {
        if (error instanceof YouTubeNotConfiguredError) throw error;
        return [series, null] as const;
      }
    }),
  );
  const videos: Partial<Record<YouTubeDevotionKey, DevotionMinute>> = {};
  for (const [series, video] of entries) {
    if (video) videos[series] = video;
  }
  return videos;
}
