import { readFileSync } from "node:fs";
import { defineSeed } from "void/seed";
import { noticePdfUrl } from "../src/notice-files";

type HyperlinkSeed = Record<string, Array<{ name: string; href: string }>>;

type NoticeSeed = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  activityType: string;
  target: string[];
};

type VideoSeed = {
  id: string;
  title: string;
  year: number;
  playbackId: string;
  thumbnailTime: number | null;
  sortOrder: number;
  createdAt: string;
};

type CalendarSeed = {
  date: string;
  title: string;
  time: string;
  location: string;
  isCamp: boolean;
  campKey: string | null;
};

const PHOTO_SECTIONS = [
  { id: "2011-2015", label: "2011-2015年相片", years: [2011, 2012, 2013, 2014, 2015], sortOrder: 0 },
  { id: "2016-2020", label: "2016-2020年相片", years: [2016, 2017, 2018, 2019, 2020], sortOrder: 1 },
  { id: "2021-2025", label: "2021-2025年相片", years: [2021, 2022, 2023, 2024, 2025], sortOrder: 2 },
  { id: "2026", label: "2026年相片", years: [2026], sortOrder: 3 },
];

const HOMEPAGE_SETTINGS = [
  { key: "homepage.banner", value: "/photo/2026/2026-08-promotion/2026-08-promotion-131.jpg" },
  { key: "homepage.adventurer", value: "/photo/2025/2025-08-tpark/2025-08-tpark-6.jpg" },
  { key: "homepage.pathfinder", value: "/photo/2025/2025-07-camp/2025-07-camp-13.jpg" },
];

export default defineSeed<typeof import("./schema")>(async ({ db, schema }) => {
  const hyperlinks = JSON.parse(
    readFileSync(new URL("./hyperlink-seed.json", import.meta.url), "utf8"),
  ) as HyperlinkSeed;

  await db.insert(schema.siteSettings).values(HOMEPAGE_SETTINGS);
  await db.insert(schema.photoSections).values(PHOTO_SECTIONS);

  const linkRows = Object.entries(hyperlinks).flatMap(([yearGroup, items]) =>
    items.map((item, sortOrder) => ({
      yearGroup,
      name: item.name,
      href: item.href,
      sortOrder,
    })),
  );
  if (linkRows.length > 0) {
    await db.insert(schema.hyperlinks).values(linkRows);
  }

  const notices = JSON.parse(
    readFileSync(new URL("./notice-seed.json", import.meta.url), "utf8"),
  ) as NoticeSeed[];
  if (notices.length > 0) {
    await db.insert(schema.notices).values(
      notices.map((notice) => ({
        id: notice.id,
        title: notice.title,
        date: notice.date,
        endDate: notice.endDate || notice.date,
        activityType: notice.activityType,
        pdfUrls: notice.target.flatMap((target) => {
          const url = noticePdfUrl(notice.id, target);
          return url ? [url] : [];
        }),
        target: notice.target,
      })),
    );
  }

  const videoRows = JSON.parse(
    readFileSync(new URL("./video-seed.json", import.meta.url), "utf8"),
  ) as VideoSeed[];
  if (videoRows.length > 0) {
    await db.insert(schema.videos).values(videoRows);
  }

  const calendar = JSON.parse(
    readFileSync(new URL("./calendar-seed.json", import.meta.url), "utf8"),
  ) as CalendarSeed[];
  for (let index = 0; index < calendar.length; index += 40) {
    await db.insert(schema.calendarEvents).values(calendar.slice(index, index + 40));
  }
});
