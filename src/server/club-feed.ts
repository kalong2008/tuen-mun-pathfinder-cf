import { albumHighlights, calendarEvents, hyperlinks, notices, videos } from "@schema";
import { asc, db, desc } from "void/db";
import { sortAdventurerHonors } from "../honors/lib/display/sort";
import { loadPublishedHonors } from "./load-adventurer-honors";

/** JSON for the iOS app. Website pages read these tables in their own loaders. */

const jsonHeaders = { "cache-control": "no-store" };

export function clubJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: jsonHeaders });
}

export async function calendarFeed() {
  const events = await db.select().from(calendarEvents).orderBy(asc(calendarEvents.date), asc(calendarEvents.id));
  const activities: Record<string, Array<Record<string, unknown>>> = {};
  for (const event of events) {
    const activity: Record<string, unknown> = {
      id: event.activityId || String(event.id),
      title: event.title,
      startTime: event.startTime || event.time,
      endTime: event.endTime,
      location: event.location,
      gatherLocation: event.gatherLocation,
      dismissLocation: event.dismissLocation,
      fee: event.fee,
      activityType: event.activityType,
      participants: event.participants ?? [],
    };
    if (event.noticeId) {
      activity.noticeId = event.noticeId;
      activity.hasPdf = {
        前鋒會: event.hasPathfinderPdf,
        幼鋒會: event.hasAdventurerPdf,
      };
    }
    if (event.campKey) activity.campKey = event.campKey;
    const day = activities[event.date] ?? [];
    day.push(activity);
    activities[event.date] = day;
  }
  return activities;
}

export async function noticeFeed() {
  const rows = await db.select().from(notices).orderBy(desc(notices.date), asc(notices.title));
  return rows.map((notice) => ({
    id: notice.id,
    title: notice.title,
    date: notice.date,
    endDate: notice.endDate,
    activityType: notice.activityType,
    pdfUrl: notice.pdfUrls ?? [],
    target: notice.target ?? [],
    participants: notice.participants ?? [],
    startTime: notice.startTime,
    endTime: notice.endTime,
    gatherLocation: notice.gatherLocation,
    dismissLocation: notice.dismissLocation,
    location: notice.location,
    charged: notice.charged,
    fee: notice.fee,
  }));
}

export async function videoFeed() {
  const rows = await db
    .select()
    .from(videos)
    .orderBy(desc(videos.year), asc(videos.sortOrder), desc(videos.createdAt));
  return rows.map((video) => ({
    id: video.id,
    title: video.title,
    year: video.year,
    playbackId: video.playbackId,
    thumbnailTime: video.thumbnailTime,
    sortOrder: video.sortOrder,
    createdAt: video.createdAt,
  }));
}

export async function hyperlinkFeed() {
  const rows = await db.select().from(hyperlinks).orderBy(asc(hyperlinks.yearGroup), asc(hyperlinks.sortOrder));
  const grouped: Record<string, Array<{ name: string; href: string }>> = {};
  for (const row of rows) {
    const current = grouped[row.yearGroup] ?? [];
    current.push({ name: row.name, href: row.href });
    grouped[row.yearGroup] = current;
  }
  return grouped;
}

const site = "https://tuenmunpathfinder.com";

function absolute(path: string | undefined): string {
  if (!path) return "";
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  return `${site}${path.startsWith("/") ? path : `/${path}`}`;
}

function appHonorPath(id: string, suffix: string): string {
  return absolute(`/api/app/honors/${encodeURIComponent(id)}/${suffix}`);
}

export async function honorFeed() {
  const honors = sortAdventurerHonors(await loadPublishedHonors());
  return honors.map((honor) => ({
    id: honor.id,
    code: honor.code,
    nameZh: honor.nameZh,
    nameEn: honor.nameEn ?? "",
    aliases: honor.aliases,
    category: honor.category,
    status: honor.status,
    answerSource: honor.answerSource,
    answerSourceNote: honor.answerSourceNote ?? "",
    requirementsHtml: honor.requirementsHtml,
    answerPrefaceHtml: honor.answerPrefaceHtml,
    answers: honor.answers,
    searchText: honor.searchText,
    badgeUrl: absolute(honor.badgeUrl),
    docxUrl: honor.docxUrl ? appHonorPath(honor.id, "file/docx") : "",
    pdfZhUrl: honor.pdfZhUrl ? appHonorPath(honor.id, "file/zh") : "",
    pdfEnUrl: honor.pdfEnUrl ? appHonorPath(honor.id, "file/en") : "",
    canvaViewUrl: honor.canvaViewUrl ? appHonorPath(honor.id, "canva/view") : "",
    canvaPdfUrl: honor.canvaPdfUrl ? appHonorPath(honor.id, "canva/pdf") : "",
  }));
}

export async function albumHighlightFeed() {
  const rows = await db
    .select()
    .from(albumHighlights)
    .orderBy(asc(albumHighlights.scope), asc(albumHighlights.sortOrder));
  return rows.map((row) => ({
    scope: row.scope,
    year: row.year,
    slug: row.slug,
    sortOrder: row.sortOrder,
  }));
}
