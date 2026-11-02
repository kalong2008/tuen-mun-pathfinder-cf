import { createFileRoute } from "@tanstack/react-router";
import { fetchHonorFile, isHonorFileSlot } from "../../../../../server/honor-files";

export const Route = createFileRoute("/api/adventurer-honors/$id/file/$slot")({
  server: {
    handlers: {
      GET: ({ params }) => {
        if (!isHonorFileSlot(params.slot)) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        return fetchHonorFile(params.id, params.slot);
      },
    },
  },
});
