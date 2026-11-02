import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { videos } from "@schema";
import { asc, db, desc } from "void/db";
import { Shell } from "../components/shell";

const getVideos = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(videos).orderBy(desc(videos.year), asc(videos.sortOrder), desc(videos.createdAt));
});

export const Route = createFileRoute("/videos")({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: typeof search.v === "string" && search.v ? search.v : undefined,
  }),
  loader: () => getVideos(),
  head: () => ({
    meta: [{ title: "歷屆影片 | 屯門前鋒會 幼鋒會" }],
  }),
  component: VideosPage,
});

function VideosPage() {
  const rows = Route.useLoaderData();
  const { v } = Route.useSearch();
  const navigate = useNavigate();
  const selected = rows.find((video) => video.id === v) ?? rows[0];
  const years = new Map<number, typeof rows>();
  for (const video of rows) {
    const current = years.get(video.year) ?? [];
    current.push(video);
    years.set(video.year, current);
  }

  if (!selected) {
    return (
      <Shell>
        <section className="page">
          <p className="empty">暫時未有影片。</p>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="page">
        <div className="videos">
          <div className="video-stage">
            <div className="video-frame">
              <iframe
                key={selected.playbackId}
                src={playerUrl(selected.playbackId)}
                title={selected.title}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            <h2>{selected.title}</h2>
            <DownloadButton videoId={selected.id} />
          </div>
          <aside className="video-list">
            <div className="video-list-head">
              <h2>歷屆影片</h2>
              <p>{rows.length} 部影片</p>
            </div>
            <div className="video-scroll">
              {[...years.entries()].map(([year, items]) => (
                <section key={year}>
                  <h3 className="video-year">{year}年</h3>
                  <ul>
                    {items.map((video) => {
                      const index = rows.findIndex((item) => item.id === video.id) + 1;
                      const current = video.id === selected.id;
                      return (
                        <li key={video.id}>
                          <button
                            type="button"
                            className={current ? "video-item is-current" : "video-item"}
                            onClick={() => {
                              void navigate({
                                to: "/videos",
                                search: { v: video.id },
                                replace: true,
                                resetScroll: false,
                              });
                            }}
                          >
                            <span className="video-index">{index}</span>
                            <img src={thumbnailUrl(video.playbackId, video.thumbnailTime)} alt="" width={128} height={72} />
                            <span>{video.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}

function playerUrl(playbackId: string) {
  return `https://player.mux.com/${encodeURIComponent(playbackId)}`;
}

function thumbnailUrl(playbackId: string, thumbnailTime: number | null) {
  const params = new URLSearchParams({ width: "320" });
  if (thumbnailTime !== null) params.set("time", String(thumbnailTime));
  return `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.webp?${params.toString()}`;
}

function DownloadButton({ videoId }: { videoId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="download-button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setMessage(null);
          void fetch(`/api/videos/${encodeURIComponent(videoId)}/download`)
            .then(async (response) => {
              const body = (await response.json()) as { status?: string; url?: string; error?: string };
              if (body.status === "ready" && body.url) {
                window.location.href = body.url;
                return;
              }
              setMessage(body.error || "無法提供此影片的 720p 下載檔");
            })
            .catch(() => setMessage("下載失敗，請稍後再試"))
            .finally(() => setBusy(false));
        }}
      >
        下載影片（720p）
      </button>
      {message ? <p className="download-note" role="status">{message}</p> : null}
    </div>
  );
}
