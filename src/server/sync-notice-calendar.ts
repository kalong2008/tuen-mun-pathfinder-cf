import { calendarEvents, notices } from "@schema";
import { db } from "void/db";
import { MEETINGS_WORKSHEET_ID, NOTICES_WORKSHEET_ID, toSyncRows, type CalendarSyncRow, type NoticeSyncRow } from "./notice-calendar";
import { listWorksheetRows } from "./nocoly";

const INSERT_CHUNK = 8;

export async function syncNoticeCalendar(): Promise<{ notices: number; events: number }> {
  const [meetingRows, noticeRows] = await Promise.all([
    listWorksheetRows(MEETINGS_WORKSHEET_ID),
    listWorksheetRows(NOTICES_WORKSHEET_ID),
  ]);
  const next = toSyncRows(meetingRows, noticeRows);
  if (next.notices.length === 0 && next.events.length === 0) {
    throw new Error("Nocoly returned no calendar or notice rows. Kept the existing database.");
  }

  await replaceNoticeCalendar(next.notices, next.events);
  return { notices: next.notices.length, events: next.events.length };
}

async function replaceNoticeCalendar(noticeRows: NoticeSyncRow[], eventRows: CalendarSyncRow[]) {
  const statements = [
    db.delete(calendarEvents),
    db.delete(notices),
    ...chunks(noticeRows, INSERT_CHUNK).map((rows) => db.insert(notices).values(rows)),
    ...chunks(eventRows, INSERT_CHUNK).map((rows) => db.insert(calendarEvents).values(rows)),
  ];
  const [first, ...rest] = statements;
  await db.batch([first, ...rest]);
}

function chunks<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}
