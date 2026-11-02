import { createFileRoute } from "@tanstack/react-router";
import { openCanvaView } from "../../../../../server/canva";

export const Route = createFileRoute("/api/adventurer-honors/$id/canva/view")({
  server: {
    handlers: {
      GET: ({ params }) => openCanvaView(params.id),
    },
  },
});
