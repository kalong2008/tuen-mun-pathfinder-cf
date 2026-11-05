import { createFileRoute } from "@tanstack/react-router";
import { clubJson, honorFeed } from "../../../server/club-feed";

export const Route = createFileRoute("/api/app/honors")({
  server: {
    handlers: {
      GET: async () => clubJson(await honorFeed()),
    },
  },
});
