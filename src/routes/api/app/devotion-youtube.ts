import { createFileRoute } from "@tanstack/react-router";
import { clubJson } from "../../../server/club-feed";
import { latestYouTubeDevotions, YouTubeNotConfiguredError } from "../../../server/youtube";

export const Route = createFileRoute("/api/app/devotion-youtube")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return clubJson(await latestYouTubeDevotions());
        } catch (error) {
          if (error instanceof YouTubeNotConfiguredError) {
            return clubJson({ error: error.message }, 503);
          }
          return clubJson({ error: "暫時未有這一集。" }, 502);
        }
      },
    },
  },
});
