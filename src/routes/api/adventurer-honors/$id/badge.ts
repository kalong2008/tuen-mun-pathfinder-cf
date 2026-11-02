import { createFileRoute } from "@tanstack/react-router";
import { fetchHonorBadge } from "../../../../server/honor-files";

export const Route = createFileRoute("/api/adventurer-honors/$id/badge")({
  server: {
    handlers: {
      GET: ({ params }) => fetchHonorBadge(params.id),
    },
  },
});
