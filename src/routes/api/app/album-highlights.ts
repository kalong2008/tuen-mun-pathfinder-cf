import { createFileRoute } from "@tanstack/react-router";
import { albumHighlightFeed, clubJson } from "../../../server/club-feed";

export const Route = createFileRoute("/api/app/album-highlights")({
  server: {
    handlers: {
      GET: async () => clubJson(await albumHighlightFeed()),
    },
  },
});
