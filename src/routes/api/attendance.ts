import { createFileRoute } from "@tanstack/react-router";
import { AttendanceReportError, loadAttendanceReport } from "../../server/attendance";
import { isCurrentUserAdmin } from "../../server/require-admin";

export const Route = createFileRoute("/api/attendance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isCurrentUserAdmin())) {
          return Response.json({ error: "Access denied. Admin only." }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        try {
          const report = await loadAttendanceReport({
            preset: searchParams.get("preset"),
            startDate: searchParams.get("startDate"),
            endDate: searchParams.get("endDate"),
          });
          return Response.json(report);
        } catch (error) {
          if (error instanceof AttendanceReportError) {
            return Response.json({ error: error.message }, { status: error.status });
          }
          return Response.json({ error: "Failed to load attendance report." }, { status: 500 });
        }
      },
    },
  },
});
