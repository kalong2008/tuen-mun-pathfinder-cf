import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AdventurerHonorsClient } from "../honors/components/AdventurerHonorsClient";
import { sortAdventurerHonors } from "../honors/lib/display/sort";
import { Shell } from "../components/shell";
import { loadHonorHandbooks, loadPublishedHonors } from "../server/load-adventurer-honors";
import { assertSignedIn, requireSignedIn } from "../server/require-user";
import { isCurrentUserAdmin } from "../server/require-admin";

const getHonorsPage = createServerFn({ method: "GET" }).handler(async () => {
  await assertSignedIn("/adventurer-honors");
  if (!(await isCurrentUserAdmin())) {
    return { denied: true as const, honors: [], handbooks: { zh: false, en: false } };
  }

  const [honors, handbooks] = await Promise.all([loadPublishedHonors(), loadHonorHandbooks()]);
  return {
    denied: false as const,
    honors: sortAdventurerHonors(honors),
    handbooks,
  };
});

export const Route = createFileRoute("/adventurer-honors")({
  beforeLoad: () => requireSignedIn("/adventurer-honors"),
  loader: () => getHonorsPage(),
  head: () => ({
    meta: [
      { title: "幼鋒會榮譽證 | 屯門前鋒會 幼鋒會" },
      { name: "description", content: "搜尋幼鋒會榮譽證的中文要求、答案整理和來源連結。" },
    ],
  }),
  component: AdventurerHonorsPage,
});

function AdventurerHonorsPage() {
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
        <AdventurerHonorsClient honors={data.honors} handbooks={data.handbooks} />
      )}
    </Shell>
  );
}
