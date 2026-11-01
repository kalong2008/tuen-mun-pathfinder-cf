import { verseOfDay } from "@schema";
import { db, desc, eq } from "void/db";

export type VerseOfDay = {
  citation: string;
  passage: string;
  image: string | null;
  version: string;
  width: number | null;
  height: number | null;
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

function verseImage(html: string): { image: string; width: number; height: number } | null {
  const image = metaContent(html, "twitter:image") ?? metaContent(html, "og:image");
  if (!image) return null;
  const size = image.match(/(\d+)x(\d+)/);
  return {
    image,
    width: size ? Number(size[1]) : 640,
    height: size ? Number(size[2]) : 640,
  };
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
  const image = verseImage(listing);
  return {
    date: todayUtc(),
    citation,
    version: VERSION,
    passage,
    image: image?.image ?? null,
    width: image?.width ?? null,
    height: image?.height ?? null,
  };
}

export async function ensureVerseOfDay(): Promise<void> {
  const today = todayUtc();
  const [existing] = await db
    .select({ id: verseOfDay.id })
    .from(verseOfDay)
    .where(eq(verseOfDay.date, today))
    .limit(1);
  if (existing) return;

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
};

export async function latestVerses(limit: number): Promise<VerseOfDay[]> {
  return db.select(verseColumns).from(verseOfDay).orderBy(desc(verseOfDay.id)).limit(limit);
}
