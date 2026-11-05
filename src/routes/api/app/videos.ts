import { createFileRoute } from "@tanstack/react-router";
import { clubJson, videoFeed } from "../../../server/club-feed";

export const Route = createFileRoute("/api/app/videos")({
  server: {
    handlers: {
      GET: async () => clubJson(await videoFeed()),
    },
  },
});
