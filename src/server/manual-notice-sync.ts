import { siteSettings } from "@schema";
import { db, eq, sql } from "void/db";
import { syncNoticeCalendar } from "./sync-notice-calendar";

const MANUAL_SYNC_KEY = "sync.noticeCalendar.manualDate";
const DAILY_LIMIT = 20;

export async function runManualNoticeSync(): Promise<
  { limited: true } | { limited: false; notices: number; events: number }
> {
  const today = hongKongDate();
  const [existing] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, MANUAL_SYNC_KEY))
    .limit(1);

  const claim = await db
    .insert(siteSettings)
    .values({ key: MANUAL_SYNC_KEY, value: `${today}:1` })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: sql`CASE
          WHEN ${siteSettings.value} = ${today} THEN ${`${today}:2`}
          WHEN ${siteSettings.value} NOT LIKE ${`${today}:%`} THEN ${`${today}:1`}
          ELSE ${today} || ':' || (CAST(substr(${siteSettings.value}, ${today.length + 2}) AS INTEGER) + 1)
        END`,
      },
      where: sql`${siteSettings.value} = ${today}
        OR ${siteSettings.value} NOT LIKE ${`${today}:%`}
        OR CAST(substr(${siteSettings.value}, ${today.length + 2}) AS INTEGER) < ${DAILY_LIMIT}`,
    });

  if (claim.meta.changes === 0) {
    return { limited: true };
  }

  try {
    const result = await syncNoticeCalendar();
    return { limited: false, notices: result.notices, events: result.events };
  } catch (error) {
    if (existing) {
      await db.update(siteSettings).set({ value: existing.value }).where(eq(siteSettings.key, MANUAL_SYNC_KEY));
    } else {
      await db.delete(siteSettings).where(eq(siteSettings.key, MANUAL_SYNC_KEY));
    }
    throw error;
  }
}

function hongKongDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
