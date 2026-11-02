import { useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import PhotoAlbum, { type RenderPhotoProps } from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import { hyperlinks } from "@schema";
import { db, eq } from "void/db";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { Shell } from "../components/shell";
import { albumManifestUrl, photoUrl } from "../photos";
import { assertSignedIn, requireSignedIn } from "../server/require-user";

type ManifestPhoto = {
  url?: string;
  width?: number;
  height?: number;
};

async function findAlbumLink(slug: string) {
  if (slug === "archive") throw notFound();
  const [link] = await db
    .select()
    .from(hyperlinks)
    .where(eq(hyperlinks.href, `/${slug}`))
    .limit(1);
  if (!link) throw notFound();
  return link;
}

const getAlbumLink = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const link = await findAlbumLink(slug);
    return { name: link.name };
  });

const getAlbum = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const link = await findAlbumLink(slug);
    const title = link.name;
    if (slug.startsWith("20")) {
      await assertSignedIn(`/${slug}`);
    }
    const response = await fetch(albumManifestUrl(slug));
    if (!response.ok) {
      return { title, photos: [] };
    }
    const manifest = (await response.json()) as { photos?: ManifestPhoto[] } | ManifestPhoto[];
    const list = Array.isArray(manifest) ? manifest : (manifest.photos ?? []);
    return {
      title,
      photos: list.flatMap((photo) => {
        if (!photo.url) return [];
        return [{
          src: photoUrl(photo.url),
          width: photo.width ?? 3,
          height: photo.height ?? 2,
          alt: link.name,
        }];
      }),
    };
  });

export const Route = createFileRoute("/$slug")({
  beforeLoad: async ({ params }) => {
    await getAlbumLink({ data: params.slug });
    if (!params.slug.startsWith("20")) return;
    await requireSignedIn(`/${params.slug}`);
  },
  loader: ({ params }) => getAlbum({ data: params.slug }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "找不到頁面"} | 屯門前鋒會 幼鋒會` }],
  }),
  component: AlbumPage,
  notFoundComponent: AlbumNotFound,
});

function AlbumPhoto({ wrapperStyle, renderDefaultPhoto }: RenderPhotoProps) {
  return (
    <div className="album-photo" style={{ ...wrapperStyle, borderRadius: "10px", overflow: "hidden" }}>
      {renderDefaultPhoto({ wrapped: true })}
    </div>
  );
}

function AlbumNotFound() {
  return (
    <Shell>
      <section className="page">
        <h1 className="page-title">找不到頁面</h1>
        <p className="empty">這個網址沒有對應的頁面。</p>
      </section>
    </Shell>
  );
}

function AlbumPage() {
  const album = Route.useLoaderData();
  const [index, setIndex] = useState(-1);

  return (
    <Shell>
      <section className="page page-wide">
        <h1 className="page-title">{album.title}</h1>
        {album.photos.length === 0 ? (
          <p className="empty">這本相簿暫時沒有相片。</p>
        ) : (
          <>
            <PhotoAlbum
              photos={album.photos}
              layout="rows"
              renderPhoto={AlbumPhoto}
              defaultContainerWidth={1200}
              sizes={{ size: "calc(100vw - 240px)" }}
              onClick={({ index: photoIndex }) => setIndex(photoIndex)}
            />
            <Lightbox
              slides={album.photos}
              open={index >= 0}
              index={index}
              close={() => setIndex(-1)}
              plugins={[Download, Fullscreen, Slideshow, Counter]}
              counter={{ container: { style: { top: "unset", bottom: 0 } } }}
            />
          </>
        )}
      </section>
    </Shell>
  );
}
