import { createFileRoute } from "@tanstack/react-router";
import { ensureVerseOfDay, latestVerses } from "../../../server/verse";

export const Route = createFileRoute("/api/bible/cached")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureVerseOfDay();
        const rawLimit = Number(new URL(request.url).searchParams.get("limit"));
        const limit = Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : 0;
        if (limit > 1) {
          const verses = await latestVerses(Math.min(limit, 14));
          return Response.json(verses);
        }
        const [verse] = await latestVerses(1);
        if (!verse) {
          return Response.json({ error: "No cached verse found" }, { status: 404 });
        }
        return Response.json(verse);
      },
    },
  },
});
