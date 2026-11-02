import { createFileRoute } from "@tanstack/react-router";
import { startCanvaOAuth } from "../../../../server/canva";

export const Route = createFileRoute("/api/canva/oauth/start")({
  server: {
    handlers: {
      GET: ({ request }) => startCanvaOAuth(request),
    },
  },
});
