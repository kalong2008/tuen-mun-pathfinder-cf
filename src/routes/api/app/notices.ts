import { createFileRoute } from "@tanstack/react-router";
import { clubJson, noticeFeed } from "../../../server/club-feed";

export const Route = createFileRoute("/api/app/notices")({
  server: {
    handlers: {
      GET: async () => clubJson(await noticeFeed()),
    },
  },
});
