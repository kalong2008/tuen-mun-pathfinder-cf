import { defineScheduled } from "void";
import { syncNoticeCalendar } from "../src/server/sync-notice-calendar";

// 06:00 Asia/Hong_Kong (UTC+8).
export const cron = "0 22 * * *";

export default defineScheduled(async () => {
  const result = await syncNoticeCalendar();
  console.log(
    `Synced ${result.notices} notices, ${result.events} calendar rows, ${result.albums} albums, ${result.pages} other pages, ${result.sections} photo sections, ${result.videos} videos, ${result.highlights} highlights, and ${result.images} homepage images.`,
  );
});
