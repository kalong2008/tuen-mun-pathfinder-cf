import { verseOfDay } from "@schema";
import { db, desc, eq } from "void/db";
import { env } from "void/env";

export type VerseOfDay = {
  citation: string;
  passage: string;
  image: string | null;
  version: string;
  width: number | null;
  height: number | null;
  attribution: string | null;
};

const VERSION = "和合本修訂版";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html: string, key: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`,
    "i",
  );
  const match = html.match(pattern);
  const value = decodeHtml(match?.[1] ?? match?.[2] ?? "").trim();
  return value || null;
}

function verseUsfm(html: string): string | null {
  const match = html.match(/\/verse-images\/([0-9A-Z]+(?:\.[0-9]+)+)\//);
  return match?.[1] ?? null;
}

const YVP_API = "https://api.youversion.com/v1";
const IMAGE_LANGUAGES = ["zh-TW", "zh-HK"] as const;

type VerseImage = {
  image: string;
  width: number | null;
  height: number | null;
  attribution: string | null;
};

type VerseOfTheDayResponse = {
  image_id: string | null;
};

type YouVersionImageRecord = {
  image_url?: string;
  width?: number;
  height?: number;
  attribution?: string;
};

function dayOfYearUtc(now = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - start) / 86_400_000) + 1;
}

function listingImage(html: string): VerseImage | null {
  const image = metaContent(html, "twitter:image") ?? metaContent(html, "og:image");
  if (!image) return null;
  const size = image.match(/(\d+)x(\d+)/);
  return {
    image,
    width: size ? Number(size[1]) : 640,
    height: size ? Number(size[2]) : 640,
    attribution: null,
  };
}

function cardImageUrl(imageUrl: string): string {
  const url = new URL(imageUrl);
  url.searchParams.set("size", "card");
  return url.toString();
}

function youVersionImage(record: YouVersionImageRecord): VerseImage | null {
  if (!record.image_url) return null;
  return {
    image: cardImageUrl(record.image_url),
    width: record.width ?? null,
    height: record.height ?? null,
    attribution: record.attribution?.trim() || null,
  };
}

let reportedMissingAppKey = false;
let imageUpgradeSkippedOn = "";

async function youVersionGet(path: string): Promise<Response | null> {
  const appKey = env.YVP_APP_KEY?.trim();
  if (!appKey) {
    if (!reportedMissingAppKey) {
      reportedMissingAppKey = true;
      console.error("YVP_APP_KEY is not set; verse image stays on the Bible.com picture");
    }
    return null;
  }
  return fetch(`${YVP_API}${path}`, {
    headers: {
      accept: "application/json",
      "X-YVP-App-Key": appKey,
    },
  });
}

/** Official daily art. Verse text stays on the Bible.com RCUV scrape. */
async function fetchYouVersionImage(): Promise<VerseImage | null> {
  const day = dayOfYearUtc();
  for (const language of IMAGE_LANGUAGES) {
    const query = new URLSearchParams();
    query.append("language_ranges[]", language);
    const listed = await youVersionGet(`/verse-of-the-days/${day}?${query}`);
    if (!listed) return null;
    if (!listed.ok) {
      throw new Error(`YouVersion verse of the day responded ${listed.status}`);
    }
    const verse = (await listed.json()) as VerseOfTheDayResponse;
    if (!verse.image_id) continue;
    const resolved = await youVersionGet(`/images/${encodeURIComponent(verse.image_id)}`);
    if (!resolved) return null;
    if (resolved.status === 404) continue;
    if (!resolved.ok) {
      throw new Error(`YouVersion image responded ${resolved.status}`);
    }
    const image = youVersionImage((await resolved.json()) as YouVersionImageRecord);
    if (image) return image;
  }
  return null;
}

function isYouVersionImage(image: string | null): boolean {
  return image?.includes("cdn.youversion.com") ?? false;
}

async function readHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "accept-language": "zh-TW",
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Bible.com responded ${response.status}`);
  }
  return response.text();
}

async function fetchTodayVerse() {
  const listing = await readHtml("https://www.bible.com/zh-TW/verse-of-the-day");
  const usfm = verseUsfm(listing);
  if (!usfm) {
    throw new Error("Bible.com verse reference was missing");
  }
  const page = await readHtml(`https://www.bible.com/bible/139/${usfm}.RCUV`);
  const title = decodeHtml(page.match(/<title>([^<]+)<\/title>/)?.[1] ?? "");
  const citation = title.split(" (RCUV)")[0]?.trim() ?? "";
  const passage = metaContent(page, "og:description") ?? metaContent(page, "description");
  if (!citation || !passage) {
    throw new Error("Bible.com verse text was missing");
  }
  let image = listingImage(listing);
  try {
    image = (await fetchYouVersionImage()) ?? image;
  } catch (error) {
    console.error("Failed to load the YouVersion verse image:", error);
  }
  return {
    date: todayUtc(),
    citation,
    version: VERSION,
    passage,
    image: image?.image ?? null,
    width: image?.width ?? null,
    height: image?.height ?? null,
    attribution: image?.attribution ?? null,
  };
}

async function upgradeVerseImage(id: number, today: string): Promise<void> {
  try {
    const image = await fetchYouVersionImage();
    if (!env.YVP_APP_KEY?.trim()) return;
    if (!image) {
      imageUpgradeSkippedOn = today;
      return;
    }
    await db
      .update(verseOfDay)
      .set({
        image: image.image,
        width: image.width,
        height: image.height,
        attribution: image.attribution,
      })
      .where(eq(verseOfDay.id, id));
  } catch (error) {
    imageUpgradeSkippedOn = today;
    console.error("Failed to refresh the verse image:", error);
  }
}

export async function ensureVerseOfDay(): Promise<void> {
  const today = todayUtc();
  const [existing] = await db
    .select({ id: verseOfDay.id, image: verseOfDay.image })
    .from(verseOfDay)
    .where(eq(verseOfDay.date, today))
    .limit(1);
  if (existing) {
    if (!isYouVersionImage(existing.image) && imageUpgradeSkippedOn !== today) {
      await upgradeVerseImage(existing.id, today);
    }
    return;
  }

  try {
    const verse = await fetchTodayVerse();
    if (verse.date !== today) return;
    await db.insert(verseOfDay).values(verse);
  } catch (error) {
    console.error("Failed to refresh the verse of the day:", error);
  }
}

const verseColumns = {
  citation: verseOfDay.citation,
  passage: verseOfDay.passage,
  image: verseOfDay.image,
  version: verseOfDay.version,
  width: verseOfDay.width,
  height: verseOfDay.height,
  attribution: verseOfDay.attribution,
};

export async function latestVerses(limit: number): Promise<VerseOfDay[]> {
  return db.select(verseColumns).from(verseOfDay).orderBy(desc(verseOfDay.id)).limit(limit);
}
