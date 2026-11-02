import { createFileRoute } from "@tanstack/react-router";
import { finishCanvaOAuth } from "../../../../server/canva";

export const Route = createFileRoute("/api/canva/oauth/callback")({
  server: {
    handlers: {
      GET: ({ request }) => finishCanvaOAuth(request),
    },
  },
});
