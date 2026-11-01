import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { calendarEvents, notices, siteSettings } from "@schema";
import { asc, db } from "void/db";
import { ClubCalendar } from "../components/club-calendar";
import { VersePopup } from "../components/verse-popup";
import { noticeFiles } from "../notice-files";
import { Shell } from "../components/shell";
import { photoUrl } from "../photos";

const WHATSAPP = "https://wa.me/85265721493?text=我想查詢有關幼鋒會及前鋒會的資料。";

const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const [settings, events, noticeRows] = await Promise.all([
    db.select().from(siteSettings).orderBy(asc(siteSettings.key)),
    db.select().from(calendarEvents).orderBy(asc(calendarEvents.date)),
    db.select().from(notices),
  ]);
  return {
    settings,
    events: events.map((event) => ({
      ...event,
      files: event.title === "集會" ? [] : filesForEvent(event, noticeRows),
    })),
  };
});

export const Route = createFileRoute("/")({
  loader: () => getHome(),
  component: HomePage,
});

function filesForEvent(
  event: { title: string; date: string; campKey: string | null },
  rows: Array<{ id: string; title: string; date: string; endDate: string; target: string[]; pdfUrls: string[] }>,
) {
  const notice = event.campKey
    ? rows.find((row) => row.id === event.campKey)
    : rows.find((row) => row.title === event.title && event.date >= row.date && event.date <= (row.endDate || row.date));
  return notice ? noticeFiles(notice) : [];
}

function HomePage() {
  const data = Route.useLoaderData();
  const image = (key: string) => {
    const value = data.settings.find((item) => item.key === key)?.value;
    return value ? photoUrl(value) : null;
  };

  return (
    <Shell>
      <VersePopup />
      <section className="banner">
        {image("homepage.banner") ? (
          <img src={image("homepage.banner") ?? ""} alt="" width={4000} height={1610} />
        ) : (
          <div className="banner-fallback" />
        )}
        <div className="banner-copy">
          <h1>屯門前鋒會 幼鋒會</h1>
          <p>Tuen Mun Pathfinder and Adventurer Club</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2 className="tone-navy">幼鋒會</h2>
          <div className="split">
            <div className="split-copy">
              <p>幼鋒會旨在幫助 6-9 歲的兒童成長，讓他們能在沒有父母在場的情況下，學習如何與其他小朋友相處，並能夠學到如何照顧自己。</p>
              <p>幼鋒會每星期提供專為這個年齡段的需求而設計的活動，同時每個月會有不同的主題，讓小朋友可以學習到不同的知識。</p>
            </div>
            {image("homepage.adventurer") ? (
              <img src={image("homepage.adventurer") ?? ""} alt="幼鋒會活動" width={4000} height={2667} />
            ) : null}
          </div>
          <div className="cards cards-navy">
            <article>
              <ChurchIcon />
              <h3>理念</h3>
              <p>基督復臨安息日會教會贊助的事工，幫助兒童在能夠快樂地成長、培養良好的品格。</p>
            </article>
            <article>
              <ChildIcon />
              <h3>目標</h3>
              <p>旨在培養基督般的品格與愛，養成獨立自主、堅韌自信、懂得感恩，能面對挑戰並獨立生活。</p>
            </article>
            <article>
              <BookIcon />
              <h3>課程</h3>
              <p>幼鋒會課程分為4個級別：勤蜂、陽光、工匠和援手，每個級別都針對特定年齡組設計。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2 className="tone-green">前鋒會</h2>
          <div className="split flip">
            {image("homepage.pathfinder") ? (
              <img src={image("homepage.pathfinder") ?? ""} alt="前鋒會活動" width={4000} height={2667} />
            ) : null}
            <div className="split-copy">
              <p>「前鋒會」不僅意味著行軍、露營和自然研究等探索，這個為10至15歲青少年成立的團體，更致力於達成雙重目標：開闊他們的世界視野，並幫助他們建立與上帝的關係。</p>
              <p>全球有近 200 萬會員，這個由基督復臨安息日會教會贊助的活動，接受任何願意學習並挑戰自己的青少年。</p>
            </div>
          </div>
          <div className="cards cards-green">
            <article>
              <PeopleIcon />
              <h3>領袖</h3>
              <p>我們所有導師都是義工領袖，他們都是忠心的基督徒，他們都將帶領前鋒會視為生命中的使命。</p>
            </article>
            <article>
              <TrailIcon />
              <h3>活動</h3>
              <p>前鋒會透過社區服務、自然研究、露營等多樣化活動，挑戰並激發每位會員的獨特潛能與天賦。</p>
            </article>
            <article>
              <BookIcon />
              <h3>班級</h3>
              <p>建立在六個級別的課程上，並有約 350 個涵蓋藝術、自然、個人成長等專業技能發展主題。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="band join" id="join">
        <div className="wrap center">
          <h2>今天就加入我們！</h2>
          <p>我們歡迎所有兒童及青少年加入我們的幼鋒會及前鋒會，一起學習、成長，並在與上帝建立關係的同時享受樂趣。</p>
          <a className="join-button" href={WHATSAPP} target="_blank" rel="noreferrer">聯絡我們</a>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>集會時間</h2>
          <ClubCalendar events={data.events} />
        </div>
      </section>
    </Shell>
  );
}

function ChurchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="glyph">
      <path fill="currentColor" d="M11 2h2v3h3v2h-3v2h5l4 5v8h-7v-5h-4v5H3v-8l4-5h5V7H6V5h5V2Z" />
    </svg>
  );
}

function ChildIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="glyph">
      <path fill="currentColor" d="M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM7 11h10l2 9H5l2-9Zm2.2 2-.7 5h6.9l-.7-5H9.2Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="glyph">
      <path fill="currentColor" d="M5 3h11a3 3 0 0 1 3 3v15H7a3 3 0 0 0-3 3V3Zm2 2v12.2A4.8 4.8 0 0 1 7.5 17H17V6a1 1 0 0 0-1-1H7Z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="glyph">
      <path fill="currentColor" d="M8 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 19c0-3 2.2-5 5-5s5 2 5 5v1H3v-1Zm10 .5V19c0-1.2-.3-2.3-.9-3.2 1.6-.5 3.4-.3 4.9.7 1.2.8 1.9 1.9 2 3.5v.5h-6Z" />
    </svg>
  );
}

function TrailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="glyph">
      <path fill="currentColor" d="M14 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 21 6.2 14 4 15.2 2.6 13 7 9.6l2.2 1.2 2-1.3 2.4 1.6-1.2 1.8-1.6-1-1.2 3.2L14 17l1 4h-2l-.6-2.4L8 21Zm6.2-8.2 2.2 1.4L18 11l3 2-1.4 1.8-2.2-1.2-.8 2.2-2.2-1.2 1.8-4.8Z" />
    </svg>
  );
}
