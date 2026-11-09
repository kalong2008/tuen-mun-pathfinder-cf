import { createFileRoute } from "@tanstack/react-router";
import { clubJson } from "../../../server/club-feed";
import { SoundCloudNotConfiguredError, SoundCloudRequestError, soundCloudAudio } from "../../../server/soundcloud";

export const Route = createFileRoute("/api/app/devotion-audio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const track = new URL(request.url).searchParams.get("track")?.trim() ?? "";
        try {
          return clubJson(await soundCloudAudio(track));
        } catch (error) {
          if (error instanceof SoundCloudNotConfiguredError) {
            return clubJson({ error: error.message }, 503);
          }
          if (error instanceof SoundCloudRequestError) {
            const status = error.status === 400 || error.status === 404 ? error.status : 502;
            return clubJson({ error: "暫時未能播放這一集。" }, status);
          }
          return clubJson({ error: "暫時未能播放這一集。" }, 502);
        }
      },
    },
  },
});
