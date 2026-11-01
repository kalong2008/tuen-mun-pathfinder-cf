import { readFileSync, writeFileSync } from "node:fs";

const envFile = readFileSync(
  "/Users/kalongchan/programmer/tuen-mun-pathfinder/.env.local",
  "utf8",
);
const env = Object.fromEntries(
  envFile
    .split("\n")
    .map((line) => line.match(/^([A-Z0-9_]+)="(.*)"$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2]]),
);

const MEETINGS_WORKSHEET_ID = "69ca06e5f037f1c2dd57ddfe";
const NOTICES_WORKSHEET_ID = "69ca017def0b95ca9b93c7a1";
const MEETING_FIELDS = {
  date: "69ca070059589a6272c95d19",
  held: "69ca0d8a09548df40ff05f5d",
  participants: "6ad5f695021d1ae0606c26e2",
};
const NOTICE_FIELDS = {
  title: "69ca017def0b95ca9b93c7a2",
  gatherAt: "69ca01ab09548df40ff05bbb",
  dismissAt: "6ad5f526cf181d9d8633079b",
  gatherLocation: "6ad5f644021d1ae0606c26cd",
  dismissLocation: "6ad5f644021d1ae0606c26ce",
  location: "6ad5f644021d1ae0606c26cf",
  activityType: "6ad5f644021d1ae0606c26d2",
  pathfinderPdf: "6ad5f958fe0c0b51fb8d8797",
  adventurerPdf: "6ad5f958fe0c0b51fb8d8798",
  participants: "6ad5f644021d1ae0606c26d1",
};
const PHOTO_BASE = "https://storage.googleapis.com/tuenmunpathfinder-storage";

function textValue(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function optionLabels(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const label = item && typeof item === "object" ? item.value : "";
    return typeof label === "string" && label ? [label] : [];
  });
}

function standardTime(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}:${match[3] ?? "00"}`;
}

function splitDateTime(value) {
  const raw = textValue(value);
  if (!raw) return { date: "", time: "" };
  const [date, time = ""] = raw.split(" ");
  return { date: date.slice(0, 10), time: standardTime(time) };
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function datesInRange(start, end) {
  if (!start) return [];
  const last = end && end > start ? end : start;
  const dates = [];
  let cursor = start;
  while (cursor <= last && dates.length < 21) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  if (cursor <= last && !dates.includes(last)) dates.push(last);
  return dates;
}

async function listRows(worksheetId) {
  const rows = [];
  for (let pageIndex = 1; pageIndex <= 20; pageIndex += 1) {
    const response = await fetch(
      `https://www.nocoly.com/api/v3/app/worksheets/${worksheetId}/rows/list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "HAP-Appkey": env.NOCOLY_APP_KEY,
          "HAP-Sign": env.NOCOLY_SIGN,
        },
        body: JSON.stringify({ pageSize: 200, pageIndex, includeTotalCount: true }),
      },
    );
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error_msg || "Nocoly request failed");
    }
    const pageRows = Array.isArray(payload.data?.rows) ? payload.data.rows : [];
    rows.push(...pageRows);
    const total = typeof payload.data?.total === "number" ? payload.data.total : rows.length;
    if (pageRows.length === 0 || rows.length >= total) break;
  }
  return rows;
}

function parseNotice(row) {
  const id = typeof row.rowId === "string" ? row.rowId : "";
  const title = textValue(row[NOTICE_FIELDS.title]);
  const gather = splitDateTime(row[NOTICE_FIELDS.gatherAt]);
  const dismiss = splitDateTime(row[NOTICE_FIELDS.dismissAt]);
  if (!id || !title || !gather.date) return null;
  const target = [];
  if (Array.isArray(row[NOTICE_FIELDS.pathfinderPdf]) && row[NOTICE_FIELDS.pathfinderPdf].length > 0) {
    target.push("前鋒會");
  }
  if (Array.isArray(row[NOTICE_FIELDS.adventurerPdf]) && row[NOTICE_FIELDS.adventurerPdf].length > 0) {
    target.push("幼鋒會");
  }
  return {
    id,
    title,
    date: gather.date,
    endDate: dismiss.date,
    startTime: gather.time,
    location: textValue(row[NOTICE_FIELDS.location]),
    gatherLocation: textValue(row[NOTICE_FIELDS.gatherLocation]),
    dismissLocation: textValue(row[NOTICE_FIELDS.dismissLocation]),
    activityType: optionLabels(row[NOTICE_FIELDS.activityType])[0] || "其他",
    target,
    participants: optionLabels(row[NOTICE_FIELDS.participants]),
  };
}

function parseMeeting(row) {
  const id = typeof row.rowId === "string" ? row.rowId : "";
  const date = textValue(row[MEETING_FIELDS.date]).slice(0, 10);
  if (!id || !date) return null;
  return {
    id,
    date,
    held: (optionLabels(row[MEETING_FIELDS.held])[0] ?? "") === "是",
    title: "集會",
    startTime: "14:30:00",
    location: "山景綜合青少年服務中心",
  };
}

const [meetingRows, noticeRows] = await Promise.all([
  listRows(MEETINGS_WORKSHEET_ID),
  listRows(NOTICES_WORKSHEET_ID),
]);
const notices = noticeRows.flatMap((row) => {
  const notice = parseNotice(row);
  return notice ? [notice] : [];
});
const meetings = meetingRows.flatMap((row) => {
  const meeting = parseMeeting(row);
  return meeting ? [meeting] : [];
});

const calendar = [];
for (const meeting of meetings) {
  if (!meeting.held) continue;
  calendar.push({
    date: meeting.date,
    title: meeting.title,
    time: meeting.startTime,
    location: meeting.location,
    isCamp: false,
    campKey: null,
  });
}
for (const notice of notices) {
  const dates = datesInRange(notice.date, notice.endDate);
  const campKey = dates.length > 1 ? notice.id : null;
  for (const date of dates) {
    calendar.push({
      date,
      title: notice.title,
      time: notice.startTime,
      location: notice.location || notice.gatherLocation,
      isCamp: Boolean(campKey),
      campKey,
    });
  }
}

const hyperlinks = JSON.parse(readFileSync(new URL("../db/hyperlink-seed.json", import.meta.url), "utf8"));
const covers = {};
const albums = Object.values(hyperlinks).flat();
for (const album of albums) {
  const slug = album.href.replace(/^\//, "");
  const year = slug.slice(0, 4);
  const manifestUrl = `${PHOTO_BASE}/photo/${year}/${slug}/${slug}.json`;
  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) continue;
    const manifest = await response.json();
    const list = Array.isArray(manifest) ? manifest : manifest.photos;
    const first = Array.isArray(list) ? list.find((item) => item?.url) : null;
    if (!first?.url) continue;
    const path = String(first.url).replace(/^\//, "");
    covers[album.href] = path.startsWith("http") ? path : `${PHOTO_BASE}/${path}`;
  } catch {
    // A missing album manifest stays a name-only entry.
  }
}

writeFileSync(new URL("../db/notice-seed.json", import.meta.url), JSON.stringify(notices, null, 2));
writeFileSync(new URL("../db/calendar-seed.json", import.meta.url), JSON.stringify(calendar, null, 2));
writeFileSync(new URL("../db/album-covers.json", import.meta.url), JSON.stringify(covers, null, 2));
console.log(`notices ${notices.length}, calendar ${calendar.length}, covers ${Object.keys(covers).length}`);
