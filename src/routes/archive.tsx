import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { hyperlinks } from "@schema";
import { asc, db } from "void/db";
import { Shell } from "../components/shell";
import { coverFor } from "../photos";
import { assertSignedIn, requireSignedIn } from "../server/require-user";

const getArchive = createServerFn({ method: "GET" }).handler(async () => {
  await assertSignedIn("/archive");
  const links = await db
    .select()
    .from(hyperlinks)
    .orderBy(asc(hyperlinks.yearGroup), asc(hyperlinks.sortOrder));
  return {
    links: links.map((link) => ({ ...link, cover: coverFor(link.href) })),
  };
});

export const Route = createFileRoute("/archive")({
  beforeLoad: () => requireSignedIn("/archive"),
  loader: () => getArchive(),
  component: ArchivePage,
});

function ArchivePage() {
  const { links } = Route.useLoaderData();
  const years = new Map<string, typeof links>();
  for (const link of links) {
    if (link.yearGroup === "other") continue;
    const current = years.get(link.yearGroup) ?? [];
    current.push(link);
    years.set(link.yearGroup, current);
  }
  const yearKeys = [...years.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <Shell>
      <section className="page">
        <h1 className="page-title">相簿</h1>
        {yearKeys.length === 0 ? (
          <p className="empty">相簿索引是空的。</p>
        ) : (
          yearKeys.map((year) => (
            <div className="year-block" key={year}>
              <h2>{year}</h2>
              <div className="album-grid">
                {(years.get(year) ?? []).map((link) => (
                  <Link
                    key={link.id}
                    to="/archive/$slug"
                    params={{ slug: link.href.replace(/^\//, "") }}
                    className="album-card"
                  >
                    {link.cover ? (
                      <img src={link.cover} alt="" width={640} height={480} loading="lazy" />
                    ) : (
                      <span className="album-fallback" />
                    )}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </Shell>
  );
}
