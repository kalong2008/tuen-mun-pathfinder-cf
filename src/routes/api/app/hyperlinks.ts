import { createFileRoute } from "@tanstack/react-router";
import { clubJson, hyperlinkFeed } from "../../../server/club-feed";

export const Route = createFileRoute("/api/app/hyperlinks")({
  server: {
    handlers: {
      GET: async () => clubJson(await hyperlinkFeed()),
    },
  },
});
