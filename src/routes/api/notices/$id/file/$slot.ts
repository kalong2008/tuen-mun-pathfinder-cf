import { createFileRoute } from "@tanstack/react-router";
import { fetchNoticePdf, isPdfSlot } from "../../../../../server/notice-pdf";

export const Route = createFileRoute("/api/notices/$id/file/$slot")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!isPdfSlot(params.slot)) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return fetchNoticePdf(params.id, params.slot);
      },
    },
  },
});
