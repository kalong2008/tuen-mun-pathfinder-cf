import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { notices } from "@schema";
import { db, desc } from "void/db";
import { Shell } from "../components/shell";
import { noticeFiles } from "../notice-files";

const getNotices = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(notices).orderBy(desc(notices.date));
});

export const Route = createFileRoute("/notice")({
  loader: () => getNotices(),
  component: NoticePage,
});

function NoticePage() {
  const rows = Route.useLoaderData().filter((notice) => noticeFiles(notice).length > 0);
  const today = localToday();
  const groups = new Map<string, typeof rows>();
  for (const notice of rows) {
    const current = groups.get(notice.activityType) ?? [];
    current.push(notice);
    groups.set(notice.activityType, current);
  }

  return (
    <Shell>
      <section className="page">
        <h1 className="page-title">活動通告</h1>
        {rows.length === 0 ? (
          <p className="empty">還沒有通告。新通告公布之後會按活動種類列在這裡。</p>
        ) : (
          <div className="notice-grid">
            {[...groups.entries()].map(([activityType, items]) => {
              const allPast = items.every((notice) => notice.date < today);
              return (
                <article key={activityType} className={allPast ? "notice-card is-past" : "notice-card"}>
                  <div className={`notice-head ${headerTone(items, allPast)}`}>
                    <span className={`notice-icon ${iconTone(items, allPast)}`}>{activityIcon(activityType)}</span>
                    <h2>
                      {activityType}活動
                      {allPast ? <small>（過去的活動）</small> : null}
                    </h2>
                  </div>
                  <div className="notice-body">
                    {items.map((notice) => {
                      const past = notice.date < today;
                      return (
                        <div key={notice.id} className={past && !allPast ? "notice-item is-past" : "notice-item"}>
                          <h3 className="notice-title">
                            <CalendarIcon />
                            {notice.title}
                          </h3>
                          <div className="notice-files">
                            {noticeFiles(notice).map((file) => (
                              <div key={file.url} className="notice-file">
                                <a href={file.url} target="_blank" rel="noreferrer">
                                  <FileIcon />
                                  <span>通告下載</span>
                                </a>
                                {file.target ? (
                                  <span className={`badge ${past ? "badge-gray" : badgeTone(file.target)}`}>{file.target}</span>
                                ) : null}
                              </div>
                            ))}
                            {notice.endDate && notice.endDate !== notice.date ? (
                              <p className="notice-range">{formatNoticeRange(notice.date, notice.endDate)}</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </Shell>
  );
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function headerTone(items: Array<{ target: string[] }>, allPast: boolean) {
  if (allPast) return "tone-gray";
  const targets = [...new Set(items.flatMap((item) => item.target))];
  if (targets.length !== 1) return "tone-purple";
  if (targets[0] === "前鋒會") return "tone-club-green";
  if (targets[0] === "幼鋒會") return "tone-blue";
  if (targets[0] === "所有成員") return "tone-purple";
  return "tone-blue";
}

function formatNoticeRange(start: string, end: string) {
  const from = dateParts(start);
  const to = dateParts(end);
  if (from.year === to.year && from.month === to.month) {
    return `${from.year}年${from.month}月${from.day}日至${to.day}日`;
  }
  if (from.year === to.year) {
    return `${from.year}年${from.month}月${from.day}日至${to.month}月${to.day}日`;
  }
  return `${from.year}年${from.month}月${from.day}日至${to.year}年${to.month}月${to.day}日`;
}

function dateParts(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

function iconTone(items: Array<{ target: string[] }>, allPast: boolean) {
  if (allPast) return "icon-gray";
  const targets = [...new Set(items.flatMap((item) => item.target))];
  if (targets.length !== 1) return "icon-purple";
  if (targets[0] === "前鋒會") return "icon-green";
  if (targets[0] === "幼鋒會") return "icon-blue";
  if (targets[0] === "所有成員") return "icon-purple";
  return "icon-blue";
}

function activityIcon(type: string) {
  switch (type) {
    case "露營":
      return <TentIcon />;
    case "遠足":
      return <HikeIcon />;
    case "日營":
      return <DayCampIcon />;
    case "訓練":
      return <TrainIcon />;
    case "參觀":
      return <VisitIcon />;
    default:
      return <FileIcon />;
  }
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function TentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M12 4 3 20M12 4l9 16M12 4v16" />
    </svg>
  );
}

function HikeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 5h6M7 5h10v14H7zM9 5V3h6v2" />
    </svg>
  );
}

function DayCampIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 11 12 4l8 7M6 10v9h12v-9" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function VisitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.8 2.5 15.2 0 18M12 3c-2.5 2.8-2.5 15.2 0 18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
    </svg>
  );
}

function badgeTone(target: string) {
  if (target === "前鋒會") return "badge-green";
  if (target === "幼鋒會") return "badge-blue";
  if (target === "所有成員") return "badge-purple";
  return "badge-gray";
}
