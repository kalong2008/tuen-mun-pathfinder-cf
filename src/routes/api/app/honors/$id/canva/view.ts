import { createFileRoute } from "@tanstack/react-router";
import { openCanvaView } from "../../../../../../server/canva";

export const Route = createFileRoute("/api/app/honors/$id/canva/view")({
  server: {
    handlers: {
      GET: ({ params }) => openCanvaView(params.id, "app"),
    },
  },
});
