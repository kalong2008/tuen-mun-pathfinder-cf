import { useState } from "react";

type ClubEvent = {
  id: number;
  date: string;
  title: string;
  time: string;
  location: string;
  campKey: string | null;
  files: Array<{ url: string; target: string }>;
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function ClubCalendar({ events }: { events: ClubEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const marked = new Set(events.filter((event) => event.date.startsWith(monthKey)).map((event) => event.date));
  const first = new Date(cursor.year, cursor.month, 1);
  const days = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  const monthEvents = dedupe(events.filter((event) => event.date.startsWith(monthKey)));
  const todayKey = toKey(today);

  return (
    <div className="cal">
      <div className="cal-board">
        <div className="cal-nav">
          <button type="button" onClick={() => shift(cursor, -1, setCursor)} aria-label="上個月">‹</button>
          <strong>{cursor.year}年{cursor.month + 1}月</strong>
          <button type="button" onClick={() => shift(cursor, 1, setCursor)} aria-label="下個月">›</button>
        </div>
        <div className="cal-week">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="cal-days">
          {cells.map((day, index) => {
            if (day === null) return <span key={`pad-${index}`} />;
            const key = `${monthKey}-${String(day).padStart(2, "0")}`;
            const weekend = new Date(cursor.year, cursor.month, day).getDay() % 6 === 0;
            return (
              <span
                key={key}
                className={[
                  marked.has(key) ? "has-activity" : "",
                  key === todayKey ? "is-today" : "",
                  weekend ? "is-weekend" : "",
                ].filter(Boolean).join(" ")}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
      <div className="cal-list">
        <h3>{cursor.month + 1}月 活動列表</h3>
        {monthEvents.length === 0 ? (
          <p className="muted">本月暫無已安排的活動。</p>
        ) : (
          <ul>
            {monthEvents.map((event) => (
              <li key={event.campKey ?? event.id}>
                <strong>{event.range ?? formatDay(event.date)}</strong>
                <span>{event.title}</span>
                {event.location ? <span>{event.location}</span> : null}
                {event.files.map((file) => (
                  <span key={file.url} className="cal-file">
                    <a href={file.url} target="_blank" rel="noreferrer">查看通告詳情</a>
                    {file.target ? <span className={`badge ${badgeTone(file.target)}`}>{file.target}</span> : null}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function badgeTone(target: string) {
  if (target === "前鋒會") return "badge-green";
  if (target === "幼鋒會") return "badge-blue";
  if (target === "所有成員") return "badge-purple";
  return "badge-gray";
}

function shift(
  cursor: { year: number; month: number },
  delta: number,
  setCursor: (value: { year: number; month: number }) => void,
) {
  const date = new Date(cursor.year, cursor.month + delta, 1);
  setCursor({ year: date.getFullYear(), month: date.getMonth() });
}

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDay(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function dedupe(events: ClubEvent[]) {
  const groups = new Map<string, ClubEvent[]>();
  for (const event of events) {
    const key = event.campKey ?? `id:${event.id}`;
    const current = groups.get(key) ?? [];
    current.push(event);
    groups.set(key, current);
  }
  return [...groups.values()].map((items) => {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const range = first.date === last.date ? undefined : `${formatDay(first.date)}–${formatDay(last.date)}`;
    return { ...first, range };
  });
}
