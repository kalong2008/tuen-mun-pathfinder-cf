export const MEETINGS_WORKSHEET_ID = "69ca06e5f037f1c2dd57ddfe";
export const NOTICES_WORKSHEET_ID = "69ca017def0b95ca9b93c7a1";

const MEETING_FIELDS = {
  date: "69ca070059589a6272c95d19",
  held: "69ca0d8a09548df40ff05f5d",
} as const;

const NOTICE_FIELDS = {
  title: "69ca017def0b95ca9b93c7a2",
  gatherAt: "69ca01ab09548df40ff05bbb",
  dismissAt: "6ad5f526cf181d9d8633079b",
  location: "6ad5f644021d1ae0606c26cf",
  activityType: "6ad5f644021d1ae0606c26d2",
  pathfinderPdf: "6ad5f958fe0c0b51fb8d8797",
  adventurerPdf: "6ad5f958fe0c0b51fb8d8798",
} as const;

const MEETING_TITLE = "集會";
const MEETING_START_TIME = "14:30:00";
const MEETING_LOCATION = "山景綜合青少年服務中心";

export type CalendarSyncRow = {
  date: string;
  title: string;
  time: string;
  location: string;
  isCamp: boolean;
  campKey: string | null;
};

export type NoticeSyncRow = {
  id: string;
  title: string;
  date: string;
  endDate: string;
  activityType: string;
  pdfUrls: string[];
  target: string[];
};

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function optionLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || !("value" in item)) return [];
    const label = (item as { value?: unknown }).value;
    return typeof label === "string" && label ? [label] : [];
  });
}

function standardTime(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return "";
  const hour = match[1].padStart(2, "0");
  const second = match[3] ?? "00";
  return `${hour}:${match[2]}:${second}`;
}

function splitDateTime(value: unknown): { date: string; time: string } {
  const raw = textValue(value);
  if (!raw) return { date: "", time: "" };
  const [date, time = ""] = raw.split(" ");
  return { date: date.slice(0, 10), time: standardTime(time) };
}

function readRowId(row: Record<string, unknown>): string {
  const value = row.rowId ?? row.rowid;
  return typeof value === "string" ? value : "";
}

function hasAttachment(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function noticeFiles(rowId: string, hasPathfinder: boolean, hasAdventurer: boolean) {
  const pdfUrls: string[] = [];
  const target: string[] = [];
  if (hasPathfinder) {
    pdfUrls.push(`/api/notices/${rowId}/file/pathfinder`);
    target.push("前鋒會");
  }
  if (hasAdventurer) {
    pdfUrls.push(`/api/notices/${rowId}/file/adventurer`);
    target.push("幼鋒會");
  }
  return { pdfUrls, target };
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

function datesInRange(start: string, end: string): string[] {
  if (!start) return [];
  const last = end && end > start ? end : start;
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= last && dates.length < 21) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  if (cursor <= last && !dates.includes(last)) dates.push(last);
  return dates;
}

function parseMeeting(row: Record<string, unknown>): CalendarSyncRow | null {
  const date = textValue(row[MEETING_FIELDS.date]).slice(0, 10);
  if (!readRowId(row) || !date) return null;
  if ((optionLabels(row[MEETING_FIELDS.held])[0] ?? "") !== "是") return null;
  return {
    date,
    title: MEETING_TITLE,
    time: MEETING_START_TIME,
    location: MEETING_LOCATION,
    isCamp: false,
    campKey: null,
  };
}

type ParsedNotice = NoticeSyncRow & { time: string; location: string };

function parseNotice(row: Record<string, unknown>): ParsedNotice | null {
  const id = readRowId(row);
  const title = textValue(row[NOTICE_FIELDS.title]);
  const gather = splitDateTime(row[NOTICE_FIELDS.gatherAt]);
  const dismiss = splitDateTime(row[NOTICE_FIELDS.dismissAt]);
  if (!id || !title || !gather.date) return null;
  const files = noticeFiles(
    id,
    hasAttachment(row[NOTICE_FIELDS.pathfinderPdf]),
    hasAttachment(row[NOTICE_FIELDS.adventurerPdf]),
  );
  return {
    id,
    title,
    date: gather.date,
    endDate: dismiss.date >= gather.date ? dismiss.date : gather.date,
    activityType: optionLabels(row[NOTICE_FIELDS.activityType])[0] ?? "",
    pdfUrls: files.pdfUrls,
    target: files.target,
    time: gather.time,
    location: textValue(row[NOTICE_FIELDS.location]),
  };
}

export function toSyncRows(
  meetingRows: Record<string, unknown>[],
  noticeRows: Record<string, unknown>[],
): { notices: NoticeSyncRow[]; events: CalendarSyncRow[] } {
  const parsedNotices = noticeRows.flatMap((row) => {
    const notice = parseNotice(row);
    return notice ? [notice] : [];
  });
  const events = [
    ...meetingRows.flatMap((row) => {
      const meeting = parseMeeting(row);
      return meeting ? [meeting] : [];
    }),
    ...parsedNotices.flatMap((notice) => calendarRowsForNotice(notice)),
  ];
  return {
    notices: parsedNotices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      date: notice.date,
      endDate: notice.endDate,
      activityType: notice.activityType,
      pdfUrls: notice.pdfUrls,
      target: notice.target,
    })),
    events,
  };
}

function calendarRowsForNotice(notice: ParsedNotice): CalendarSyncRow[] {
  const dates = datesInRange(notice.date, notice.endDate);
  const isCamp = dates.length > 1;
  return dates.map((date) => ({
    date,
    title: notice.title,
    time: notice.time,
    location: notice.location,
    isCamp,
    campKey: isCamp ? notice.id : null,
  }));
}
