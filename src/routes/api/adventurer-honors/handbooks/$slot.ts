import { createFileRoute } from "@tanstack/react-router";
import { fetchHonorHandbook, isHandbookSlot } from "../../../../server/honor-files";

export const Route = createFileRoute("/api/adventurer-honors/handbooks/$slot")({
  server: {
    handlers: {
      GET: ({ params }) => {
        if (!isHandbookSlot(params.slot)) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return fetchHonorHandbook(params.slot);
      },
    },
  },
});
