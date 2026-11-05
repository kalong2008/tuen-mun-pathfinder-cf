export const HOMEPAGE_WORKSHEET_ID = "6ae71b56021d1ae0606e5b39";
export const PHOTO_SECTIONS_WORKSHEET_ID = "6ae71d7a021d1ae0606e5b51";
export const OTHER_PAGES_WORKSHEET_ID = "6ae747728b55cec0572378b5";

const ACTIVITY_FIELDS = {
  title: "69ca017def0b95ca9b93c7a2",
  gatherAt: "69ca01ab09548df40ff05bbb",
  slug: "6ae73dc28b55cec05723786c",
  year: "6ae73e6a8b55cec057237879",
  featured: "6ae745308b55cec0572378a5",
  playbackId: "6ae73dc28b55cec05723786a",
  thumbnailTime: "6ae73dc28b55cec05723786b",
} as const;

const HOMEPAGE_FIELDS = {
  slot: "6ae71d2dcf181d9d863521cf",
  path: "6ae71d0cfe0c0b51fb8fb02a",
} as const;

const SECTION_FIELDS = {
  label: "6ae71dc28b55cec0572376a3",
  start: "6ae73e22cf181d9d86352323",
  end: "6ae73e22cf181d9d86352324",
} as const;

const PAGE_FIELDS = {
  name: "6ae747e6cf693fce891c4d0e",
  date: "6ae747e6cf693fce891c4d0f",
  slug: "6ae747e6cf693fce891c4d10",
  autoNumber: "6ae747728b55cec0572378b6",
} as const;

const HOMEPAGE_KEYS = {
  主頁: "homepage.banner",
  前鋒會: "homepage.pathfinder",
  幼鋒會: "homepage.adventurer",
} as const;

export type HomepageSetting = { key: string; value: string };
export type PhotoSectionRow = { id: string; label: string; years: number[]; sortOrder: number };
export type AlbumLinkRow = { yearGroup: string; name: string; href: string; sortOrder: number };
export type VideoRow = {
  id: string;
  title: string;
  year: number;
  playbackId: string;
  thumbnailTime: number | null;
  sortOrder: number;
};
export type HighlightRow = { scope: string; year: number; slug: string; sortOrder: number };

type Sortable<T> = T & { sortKey: string };

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function optionLabel(value: unknown): string {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== "object") return "";
  const label = (value[0] as { value?: unknown }).value;
  return typeof label === "string" ? label : "";
}

function readRowId(row: Record<string, unknown>): string {
  const value = row.rowId ?? row.rowid;
  return typeof value === "string" ? value : "";
}

function publicPath(value: string): string {
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
}

function yearNumber(value: string): number | null {
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) && year > 1900 ? year : null;
}

function yearsBetween(start: string, end: string): number[] {
  const fromYear = yearNumber(start);
  const toYear = yearNumber(end || start);
  if (fromYear === null || toYear === null) return [];
  const from = Math.min(fromYear, toYear);
  const to = Math.max(fromYear, toYear);
  const years: number[] = [];
  for (let year = from; year <= to && years.length < 30; year += 1) years.push(year);
  return years;
}

function sectionId(years: number[]): string {
  const first = years[0];
  const last = years[years.length - 1];
  if (first === undefined || last === undefined) return "";
  return first === last ? String(first) : `${first}-${last}`;
}

function homepageKey(slot: string): string | null {
  switch (slot) {
    case "主頁":
      return HOMEPAGE_KEYS.主頁;
    case "前鋒會":
      return HOMEPAGE_KEYS.前鋒會;
    case "幼鋒會":
      return HOMEPAGE_KEYS.幼鋒會;
    default:
      return null;
  }
}

function assignOrder<T extends { sortKey: string }>(items: T[], groupOf: (item: T) => string): Array<Omit<T, "sortKey"> & { sortOrder: number }> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupOf(item);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }
  const ordered: Array<Omit<T, "sortKey"> & { sortOrder: number }> = [];
  for (const group of groups.values()) {
    group.sort((left, right) => left.sortKey.localeCompare(right.sortKey));
    group.forEach((item, sortOrder) => {
      const { sortKey: _sortKey, ...rest } = item;
      ordered.push({ ...rest, sortOrder });
    });
  }
  return ordered;
}

export function homepageSettings(rows: Record<string, unknown>[]): HomepageSetting[] {
  const settings = new Map<string, string>();
  for (const row of rows) {
    const key = homepageKey(optionLabel(row[HOMEPAGE_FIELDS.slot]));
    const value = textValue(row[HOMEPAGE_FIELDS.path]);
    if (key && value) settings.set(key, value);
  }
  return [...settings.entries()].map(([key, value]) => ({ key, value }));
}

export function photoSections(rows: Record<string, unknown>[]): PhotoSectionRow[] {
  const sections = rows.flatMap((row) => {
    const label = textValue(row[SECTION_FIELDS.label]);
    const years = yearsBetween(textValue(row[SECTION_FIELDS.start]), textValue(row[SECTION_FIELDS.end]));
    const id = sectionId(years);
    if (!label || !id) return [];
    return [{ id, label, years, sortKey: String(years[0]).padStart(4, "0") }];
  });
  const unique = new Map<string, (typeof sections)[number]>();
  for (const section of sections) unique.set(section.id, section);
  return assignOrder([...unique.values()], () => "sections");
}

export function albumLinks(
  activityRows: Record<string, unknown>[],
  pageRows: Record<string, unknown>[],
): { links: AlbumLinkRow[]; pageCount: number } {
  const links = new Map<string, Sortable<Omit<AlbumLinkRow, "sortOrder"> & { fromPage: boolean }>>();
  for (const row of activityRows) {
    const href = publicPath(textValue(row[ACTIVITY_FIELDS.slug]));
    const name = textValue(row[ACTIVITY_FIELDS.title]);
    const year = textValue(row[ACTIVITY_FIELDS.year]) || href.slice(1, 5);
    if (!href || !name || !yearNumber(year)) continue;
    if (!links.has(href)) {
      links.set(href, {
        yearGroup: year.slice(0, 4),
        name,
        href,
        fromPage: false,
        sortKey: textValue(row[ACTIVITY_FIELDS.gatherAt]) || `${year.slice(0, 4)}-01-01`,
      });
    }
  }
  for (const row of pageRows) {
    const href = publicPath(textValue(row[PAGE_FIELDS.slug]));
    const name = textValue(row[PAGE_FIELDS.name]);
    if (!href || !name || links.has(href)) continue;
    const date = textValue(row[PAGE_FIELDS.date]);
    const year = yearNumber(date);
    links.set(href, {
      yearGroup: year === null ? "other" : String(year),
      name,
      href,
      fromPage: true,
      sortKey: year === null ? textValue(row[PAGE_FIELDS.autoNumber]).padStart(6, "0") : date,
    });
  }
  const ordered = assignOrder([...links.values()], (link) => link.yearGroup);
  return {
    pageCount: ordered.filter((link) => link.fromPage).length,
    links: ordered.map(({ fromPage: _fromPage, ...link }) => link),
  };
}

export function videoRows(rows: Record<string, unknown>[]): VideoRow[] {
  const videos = rows.flatMap((row) => {
    const playbackId = textValue(row[ACTIVITY_FIELDS.playbackId]);
    const title = textValue(row[ACTIVITY_FIELDS.title]);
    const year = yearNumber(textValue(row[ACTIVITY_FIELDS.year]));
    const id = readRowId(row);
    if (!playbackId || !title || year === null || !id) return [];
    const thumbnail = Number(textValue(row[ACTIVITY_FIELDS.thumbnailTime]));
    return [{
      id,
      title,
      year,
      playbackId,
      thumbnailTime: Number.isFinite(thumbnail) && textValue(row[ACTIVITY_FIELDS.thumbnailTime]) ? thumbnail : null,
      sortKey: `${year}-${title}`,
    }];
  });
  return assignOrder(videos, (video) => String(video.year));
}

export function highlightRows(rows: Record<string, unknown>[]): HighlightRow[] {
  const highlights = rows.flatMap((row) => {
    if (optionLabel(row[ACTIVITY_FIELDS.featured]) !== "是") return [];
    const slug = textValue(row[ACTIVITY_FIELDS.slug]).replace(/^\//, "");
    const year = yearNumber(textValue(row[ACTIVITY_FIELDS.year]) || slug.slice(0, 4));
    if (!slug || year === null) return [];
    return [{
      scope: "featured",
      year,
      slug,
      sortKey: textValue(row[ACTIVITY_FIELDS.gatherAt]) || `${year}-01-01`,
    }];
  });
  const unique = new Map<string, (typeof highlights)[number]>();
  for (const highlight of highlights) unique.set(`${highlight.scope}:${highlight.year}:${highlight.slug}`, highlight);
  return assignOrder([...unique.values()], (highlight) => highlight.scope);
}
