import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AttendanceDashboard } from "../../attendance/AttendanceDashboard";
import { Shell } from "../../components/shell";
import { isCurrentUserAdmin } from "../../server/require-admin";
import { assertSignedIn, requireSignedIn } from "../../server/require-user";

const getAttendancePage = createServerFn({ method: "GET" }).handler(async () => {
  await assertSignedIn("/admin/attendance");
  return { denied: !(await isCurrentUserAdmin()) };
});

export const Route = createFileRoute("/admin/attendance")({
  beforeLoad: () => requireSignedIn("/admin/attendance"),
  loader: () => getAttendancePage(),
  head: () => ({
    meta: [{ title: "Attendance dashboard | 屯門前鋒會 幼鋒會" }],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const data = Route.useLoaderData();

  return (
    <Shell>
      {data.denied ? (
        <section className="page">
          <p className="empty">僅限管理員存取。</p>
          <p className="empty">
            <Link to="/">返回首頁</Link>
          </p>
        </section>
      ) : (
        <AttendanceDashboard />
      )}
    </Shell>
  );
}
