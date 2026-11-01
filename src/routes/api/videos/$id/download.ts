import { createFileRoute } from "@tanstack/react-router";
import { videos } from "@schema";
import { db, eq } from "void/db";

export const Route = createFileRoute("/api/videos/$id/download")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [video] = await db.select().from(videos).where(eq(videos.id, params.id));
        if (!video) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        const label = sanitizeDownloadFilename(`${video.year} ${video.title}`).replace(/\.mp4$/i, "");
        const url = `https://stream.mux.com/${encodeURIComponent(video.playbackId)}/720p.mp4?download=${encodeURIComponent(label)}`;
        const head = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (!head.ok) {
          return Response.json(
            { status: "unavailable", error: "無法提供此影片的 720p 下載檔" },
            { status: 503 },
          );
        }
        return Response.json({ status: "ready", url });
      },
    },
  },
});

function sanitizeDownloadFilename(label: string) {
  const trimmed = label.trim().replace(/[^\p{L}\p{N}\s._-]+/gu, "").replace(/\s+/g, " ");
  const base = trimmed.slice(0, 120) || "video";
  return base.endsWith(".mp4") ? base : `${base}.mp4`;
}
