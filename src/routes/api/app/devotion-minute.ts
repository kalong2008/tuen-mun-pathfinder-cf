import { createFileRoute } from "@tanstack/react-router";
import { clubJson } from "../../../server/club-feed";
import { latestMinuteDevotion, YouTubeNotConfiguredError, YouTubeRequestError } from "../../../server/youtube";

export const Route = createFileRoute("/api/app/devotion-minute")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return clubJson(await latestMinuteDevotion());
        } catch (error) {
          if (error instanceof YouTubeNotConfiguredError) {
            return clubJson({ error: error.message }, 503);
          }
          if (error instanceof YouTubeRequestError) {
            const status = error.status === 404 ? 404 : 502;
            return clubJson({ error: "暫時未有這一集。" }, status);
          }
          return clubJson({ error: "暫時未有這一集。" }, 502);
        }
      },
    },
  },
});
