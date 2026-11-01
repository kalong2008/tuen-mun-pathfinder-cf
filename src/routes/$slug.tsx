import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

const getAlbum = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [link] = await db
      .select()
      .from(hyperlinks)
      .where(eq(hyperlinks.href, `/${slug}`))
      .limit(1);
    const title = link?.name ?? slug;
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
          alt: link?.name ?? slug,
        }];
      }),
    };
  });

export const Route = createFileRoute("/$slug")({
  beforeLoad: ({ params }) => {
    if (!params.slug.startsWith("20")) return;
    return requireSignedIn(`/${params.slug}`);
  },
  loader: ({ params }) => getAlbum({ data: params.slug }),
  component: AlbumPage,
});

function AlbumPhoto({ wrapperStyle, renderDefaultPhoto }: RenderPhotoProps) {
  return (
    <div className="album-photo" style={{ ...wrapperStyle, borderRadius: "10px", overflow: "hidden" }}>
      {renderDefaultPhoto({ wrapped: true })}
    </div>
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
