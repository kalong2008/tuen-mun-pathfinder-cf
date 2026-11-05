import { createFileRoute } from "@tanstack/react-router";
import { calendarFeed, clubJson } from "../../../server/club-feed";

export const Route = createFileRoute("/api/app/calendar")({
  server: {
    handlers: {
      GET: async () => clubJson(await calendarFeed()),
    },
  },
});
