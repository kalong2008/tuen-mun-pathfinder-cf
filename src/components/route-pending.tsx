import { Shell } from "./shell";

export function HomePending() {
  return (
    <Shell>
      <section className="banner" aria-hidden="true">
        <div className="banner-fallback" />
        <div className="banner-copy">
          <h1>屯門前鋒會 幼鋒會</h1>
          <p>Tuen Mun Pathfinder and Adventurer Club</p>
        </div>
      </section>
      <section className="band">
        <div className="wrap skeleton-stack">
          <p className="sr">頁面載入中</p>
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-split">
            <div className="skeleton-stack">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line-short" />
            </div>
            <div className="skeleton-block skeleton-photo" />
          </div>
        </div>
      </section>
    </Shell>
  );
}

export function NoticePending() {
  return (
    <Shell>
      <section className="page">
        <h1 className="page-title">活動通告</h1>
        <p className="sr">頁面載入中</p>
        <div className="notice-skeleton" aria-hidden="true">
          <div className="skeleton-block skeleton-card" />
          <div className="skeleton-block skeleton-card" />
        </div>
      </section>
    </Shell>
  );
}

export function VideosPending() {
  return (
    <Shell>
      <section className="page">
        <p className="sr">頁面載入中</p>
        <div className="videos">
          <div className="video-stage">
            <div className="skeleton-block video-skeleton-frame" aria-hidden="true" />
            <div className="skeleton-line skeleton-line-lg" aria-hidden="true" />
          </div>
          <aside className="video-list">
            <div className="video-list-head">
              <h2>歷屆影片</h2>
            </div>
            <div className="video-skeleton-list" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="skeleton-line" />
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}

export function HonorsPending() {
  return (
    <Shell>
      <div className="honors min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 px-4 pb-14 pt-[84px]">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-3xl bg-white p-6 shadow-md md:p-10">
            <p className="pb-3 text-sm font-semibold text-blue-700">Adventurer Honors</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-5xl">幼鋒會榮譽證</h1>
            <p className="max-w-3xl pt-4 text-gray-600">
              搜尋幼鋒會榮譽證的中文要求及答案整理。答案取自英文 Award Book 2020 或以 AI
              草擬／翻譯，請導師按需要核對使用。
            </p>
            <p className="sr">頁面載入中</p>
            <div className="honor-skeleton-grid" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="skeleton-block skeleton-honor" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}

export function AlbumGridSkeleton() {
  return (
    <div className="album-skeleton" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="skeleton-block" />
      ))}
    </div>
  );
}
