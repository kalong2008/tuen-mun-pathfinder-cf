import { createFileRoute } from "@tanstack/react-router";
import { downloadCanvaPdf } from "../../../../../../server/canva";

export const Route = createFileRoute("/api/app/honors/$id/canva/pdf")({
  server: {
    handlers: {
      GET: ({ params }) => downloadCanvaPdf(params.id, "app"),
    },
  },
});
