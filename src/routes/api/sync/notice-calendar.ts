import { createFileRoute } from "@tanstack/react-router";
import { runManualNoticeSync } from "../../../server/manual-notice-sync";

async function manualSyncResponse(): Promise<Response> {
  try {
    const outcome = await runManualNoticeSync();
    if (outcome.limited) {
      return Response.json({ ok: false, error: "Daily sync limit reached." }, { status: 429 });
    }
    return Response.json({ ok: true, notices: outcome.notices, events: outcome.events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}

export const Route = createFileRoute("/api/sync/notice-calendar")({
  server: {
    handlers: {
      GET: () => manualSyncResponse(),
      POST: () => manualSyncResponse(),
    },
  },
});
