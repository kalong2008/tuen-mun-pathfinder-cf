import { sql } from "void/db";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "void/schema-d1";

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const hyperlinks = sqliteTable(
  "hyperlinks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    yearGroup: text("year_group").notNull(),
    name: text("name").notNull(),
    href: text("href").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("idx_hyperlinks_year_group").on(table.yearGroup)],
);

export const photoSections = sqliteTable(
  "photo_sections",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    years: text("years", { mode: "json" }).$type<number[]>().notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("idx_photo_sections_sort").on(table.sortOrder)],
);

export const albumHighlights = sqliteTable(
  "album_highlights",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scope: text("scope").notNull(),
    year: integer("year").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("album_highlights_scope_slug").on(table.scope, table.year, table.slug),
    index("idx_album_highlights_scope").on(table.scope, table.sortOrder),
  ],
);

export const videos = sqliteTable(
  "videos",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    year: integer("year").notNull(),
    playbackId: text("playback_id").notNull(),
    thumbnailTime: real("thumbnail_time"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_videos_year").on(table.year),
    index("idx_videos_sort").on(table.year, table.sortOrder, table.createdAt),
  ],
);

export const calendarEvents = sqliteTable(
  "calendar_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    title: text("title").notNull(),
    time: text("time").notNull().default(""),
    location: text("location").notNull().default(""),
    isCamp: integer("is_camp", { mode: "boolean" }).notNull().default(false),
    campKey: text("camp_key"),
    marking: text("marking", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
    activityId: text("activity_id").notNull().default(""),
    startTime: text("start_time").notNull().default(""),
    endTime: text("end_time").notNull().default(""),
    gatherLocation: text("gather_location").notNull().default(""),
    dismissLocation: text("dismiss_location").notNull().default(""),
    fee: text("fee").notNull().default(""),
    activityType: text("activity_type").notNull().default(""),
    participants: text("participants", { mode: "json" }).$type<string[]>().notNull().default([]),
    noticeId: text("notice_id"),
    hasPathfinderPdf: integer("has_pathfinder_pdf", { mode: "boolean" }).notNull().default(false),
    hasAdventurerPdf: integer("has_adventurer_pdf", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    index("idx_calendar_events_date").on(table.date),
    index("idx_calendar_events_camp_key").on(table.campKey),
  ],
);

export const notices = sqliteTable(
  "notices",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    date: text("date").notNull(),
    endDate: text("end_date").notNull().default(""),
    activityType: text("activity_type").notNull(),
    pdfUrls: text("pdf_urls", { mode: "json" }).$type<string[]>().notNull().default([]),
    target: text("target", { mode: "json" }).$type<string[]>().notNull().default([]),
    startTime: text("start_time").notNull().default(""),
    endTime: text("end_time").notNull().default(""),
    gatherLocation: text("gather_location").notNull().default(""),
    dismissLocation: text("dismiss_location").notNull().default(""),
    location: text("location").notNull().default(""),
    charged: integer("charged", { mode: "boolean" }).notNull().default(false),
    fee: text("fee").notNull().default(""),
    participants: text("participants", { mode: "json" }).$type<string[]>().notNull().default([]),
  },
  (table) => [
    index("idx_notices_date").on(table.date),
    index("idx_notices_activity_type").on(table.activityType),
  ],
);

export const adventurerHonors = sqliteTable(
  "adventurer_honors",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    nameZh: text("name_zh").notNull(),
    nameEn: text("name_en").notNull().default(""),
    aliases: text("aliases").notNull().default(""),
    category: text("category").notNull().default(""),
    status: text("status").notNull().default(""),
    answerSource: text("answer_source").notNull().default(""),
    answerSourceNote: text("answer_source_note").notNull().default(""),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    requirementsMd: text("requirements_md").notNull().default(""),
    answersMd: text("answers_md").notNull().default(""),
    requirementsHtml: text("requirements_html").notNull().default(""),
    answersHtml: text("answers_html").notNull().default(""),
    badgeKey: text("badge_key").notNull().default(""),
    badgeSource: text("badge_source").notNull().default(""),
    hasDocx: integer("has_docx", { mode: "boolean" }).notNull().default(false),
    hasZhPdf: integer("has_zh_pdf", { mode: "boolean" }).notNull().default(false),
    hasEnPdf: integer("has_en_pdf", { mode: "boolean" }).notNull().default(false),
    canvaDesignId: text("canva_design_id").notNull().default(""),
  },
  (table) => [uniqueIndex("adventurer_honors_code").on(table.code)],
);

export const verseOfDay = sqliteTable("verseOfDay", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  citation: text("citation").notNull(),
  version: text("version").notNull(),
  passage: text("passage").notNull(),
  image: text("image"),
  width: integer("width"),
  height: integer("height"),
});
