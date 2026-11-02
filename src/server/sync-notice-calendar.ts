import { adventurerHonors, albumHighlights, calendarEvents, hyperlinks, notices, photoSections, siteSettings, videos } from "@schema";
import { db } from "void/db";
import {
  HONORS_VIEW_ID,
  HONORS_WORKSHEET_ID,
  honorCanvaFieldId,
  parseHonorRows,
  removeStaleHonorBadges,
  uploadChangedHonorBadges,
} from "./adventurer-honors";
import { calendarSourceRows, MEETINGS_WORKSHEET_ID, NOTICES_WORKSHEET_ID, toSyncRows } from "./notice-calendar";
import { listWorksheetRows } from "./nocoly";
import {
  albumLinks,
  highlightRows,
  HOMEPAGE_WORKSHEET_ID,
  homepageSettings,
  OTHER_PAGES_WORKSHEET_ID,
  PHOTO_SECTIONS_WORKSHEET_ID,
  photoSections as parsePhotoSections,
  videoRows,
} from "./site-content";

const INSERT_CHUNK = 8;
const BATCH_SIZE = 20;

export type SiteSyncResult = {
  notices: number;
  events: number;
  albums: number;
  pages: number;
  sections: number;
  videos: number;
  highlights: number;
  images: number;
  honors: number;
  badges: number;
  badgesRemaining: number;
};

export async function syncNoticeCalendar(): Promise<SiteSyncResult> {
  const [meetingRows, activityRows, imageRows, sectionRows, pageRows, honorRows] = await Promise.all([
    listWorksheetRows(MEETINGS_WORKSHEET_ID),
    listWorksheetRows(NOTICES_WORKSHEET_ID),
    listWorksheetRows(HOMEPAGE_WORKSHEET_ID),
    listWorksheetRows(PHOTO_SECTIONS_WORKSHEET_ID),
    listWorksheetRows(OTHER_PAGES_WORKSHEET_ID),
    listWorksheetRows(HONORS_WORKSHEET_ID, { viewId: HONORS_VIEW_ID }),
  ]);
  const calendar = toSyncRows(meetingRows, calendarSourceRows(activityRows));
  const sections = parsePhotoSections(sectionRows);
  const { links, pageCount } = albumLinks(activityRows, pageRows);
  const images = homepageSettings(imageRows);
  const videoList = videoRows(activityRows);
  const highlights = highlightRows(activityRows, sections);
  const honors = parseHonorRows(honorRows, await honorCanvaFieldId());
  if (activityRows.length === 0 || links.length === 0 || sections.length === 0 || images.length === 0) {
    throw new Error("Nocoly returned an incomplete site snapshot. Kept the existing database.");
  }
  if (calendar.notices.length === 0 && calendar.events.length === 0) {
    throw new Error("Nocoly returned no calendar or notice rows. Kept the existing database.");
  }
  if (honors.honors.length === 0) {
    throw new Error("Nocoly returned no adventurer honors. Kept the existing database.");
  }

  const badges = await uploadChangedHonorBadges(honors.honors, honors.badges);

  await runStatements([
    db.delete(calendarEvents),
    db.delete(notices),
    db.delete(hyperlinks),
    db.delete(photoSections),
    db.delete(videos),
    db.delete(albumHighlights),
    db.delete(adventurerHonors),
    ...chunks(calendar.notices, INSERT_CHUNK).map((rows) => db.insert(notices).values(rows)),
    ...chunks(calendar.events, INSERT_CHUNK).map((rows) => db.insert(calendarEvents).values(rows)),
    ...chunks(links, INSERT_CHUNK).map((rows) => db.insert(hyperlinks).values(rows)),
    ...chunks(sections, INSERT_CHUNK).map((rows) => db.insert(photoSections).values(rows)),
    ...chunks(videoList, INSERT_CHUNK).map((rows) => db.insert(videos).values(rows)),
    ...chunks(highlights, INSERT_CHUNK).map((rows) => db.insert(albumHighlights).values(rows)),
    ...chunks(honors.honors, 2).map((rows) => db.insert(adventurerHonors).values(rows)),
    ...images.map((image) => db.insert(siteSettings).values(image).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: image.value },
    })),
  ]);

  if (badges.remaining === 0) {
    await removeStaleHonorBadges(new Set(honors.badges.map((badge) => badge.key)));
  }

  return {
    notices: calendar.notices.length,
    events: calendar.events.length,
    albums: links.length - pageCount,
    pages: pageCount,
    sections: sections.length,
    videos: videoList.length,
    highlights: highlights.length,
    images: images.length,
    honors: honors.honors.length,
    badges: badges.uploaded,
    badgesRemaining: badges.remaining,
  };
}

async function runStatements(statements: Parameters<typeof db.batch>[0] extends ReadonlyArray<infer T> ? T[] : never) {
  for (let index = 0; index < statements.length; index += BATCH_SIZE) {
    const group = statements.slice(index, index + BATCH_SIZE);
    const [first, ...rest] = group;
    if (!first) continue;
    await db.batch([first, ...rest]);
  }
}

function chunks<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}
