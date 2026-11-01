import { defineScheduled } from "void";
import { ensureVerseOfDay } from "../src/server/verse";

export const cron = "0 2 * * *";

export default defineScheduled(async () => {
  await ensureVerseOfDay();
});
