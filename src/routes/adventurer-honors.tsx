import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { HonorsPending } from "../components/route-pending";
import { settle, useDeferred } from "../deferred";
import { AdventurerHonorsClient } from "../honors/components/AdventurerHonorsClient";
import type { HonorHandbooks } from "../honors/lib/data/types";
import { sortAdventurerHonors } from "../honors/lib/display/sort";
import { Shell } from "../components/shell";
import { isCanvaConnected } from "../server/canva";
import { loadHonorHandbooks, loadPublishedHonors } from "../server/load-adventurer-honors";
import { assertSignedIn, requireSignedIn } from "../server/require-user";
import { isCurrentUserAdmin } from "../server/require-admin";

const emptyHandbooks: HonorHandbooks = { zh: false, en: false };

const getHonorsPage = createServerFn({ method: "GET" }).handler(async () => {
  await assertSignedIn("/adventurer-honors");
  if (!(await isCurrentUserAdmin())) {
    return { denied: true as const, honors: [], canvaConnected: false };
  }

  const [honors, canvaConnected] = await Promise.all([
    loadPublishedHonors(),
    isCanvaConnected().catch(() => false),
  ]);
  return {
    denied: false as const,
    honors: sortAdventurerHonors(honors),
    canvaConnected,
  };
});

const getHonorHandbooks = createServerFn({ method: "GET" }).handler(async () => {
  await assertSignedIn("/adventurer-honors");
  if (!(await isCurrentUserAdmin())) return emptyHandbooks;
  return loadHonorHandbooks();
});

export const Route = createFileRoute("/adventurer-honors")({
  beforeLoad: () => requireSignedIn("/adventurer-honors"),
  loader: async () => {
    const handbooks = settle(getHonorHandbooks());
    const page = await getHonorsPage();
    if (page.denied) return { ...page, handbooks: emptyHandbooks };
    if (import.meta.env.SSR) return { ...page, handbooks: await handbooks };
    return { ...page, handbooks };
  },
  pendingComponent: HonorsPending,
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
  const handbooks = useDeferred(data.handbooks, emptyHandbooks) ?? emptyHandbooks;

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
        <AdventurerHonorsClient
          honors={data.honors}
          handbooks={handbooks}
          canvaConnected={data.canvaConnected}
        />
      )}
    </Shell>
  );
}
