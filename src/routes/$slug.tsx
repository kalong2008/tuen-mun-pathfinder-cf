import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAuth, useClerk } from "@clerk/tanstack-react-start";
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
import { rememberAlbum } from "../components/album-link";
import { Shell } from "../components/shell";
import { albumManifestUrl, photoUrl } from "../photos";
import { readIsSignedIn } from "../server/require-user";

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
    if (slug.startsWith("20") && !(await readIsSignedIn())) {
      return { locked: true as const, title, photos: [] };
    }
    const response = await fetch(albumManifestUrl(slug));
    if (!response.ok) {
      return { locked: false as const, title, photos: [] };
    }
    const manifest = (await response.json()) as { photos?: ManifestPhoto[] } | ManifestPhoto[];
    const list = Array.isArray(manifest) ? manifest : (manifest.photos ?? []);
    return {
      locked: false as const,
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
  const loaded = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { openSignIn } = useClerk();
  const [album, setAlbum] = useState(loaded);
  const [index, setIndex] = useState(-1);
  const [unlockFailed, setUnlockFailed] = useState(false);
  const opened = useRef(false);
  const unlocking = useRef<string | null>(null);

  useEffect(() => {
    setAlbum(loaded);
    setUnlockFailed(false);
  }, [loaded]);

  useEffect(() => {
    if (!loaded.locked || !isLoaded) return;
    if (!isSignedIn) {
      if (opened.current) return;
      opened.current = true;
      rememberAlbum(`/${slug}`);
      openSignIn();
      return;
    }
    if (unlocking.current === slug) return;
    unlocking.current = slug;
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (cancelled) return;
      const next = await getAlbum({
        data: slug,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (cancelled) return;
      if (!next.locked) {
        try {
          sessionStorage.removeItem(`album-reload:${slug}`);
        } catch {
          // The album is already unlocked. Storage is only the reload guard.
        }
        setAlbum(next);
        return;
      }
      const key = `album-reload:${slug}`;
      try {
        if (sessionStorage.getItem(key) !== "1") {
          sessionStorage.setItem(key, "1");
          window.location.reload();
          return;
        }
      } catch {
        // Storage can be unavailable. Show the locked state below.
      }
      setUnlockFailed(true);
    })().catch(() => {
      if (!cancelled) setUnlockFailed(true);
    });
    return () => {
      cancelled = true;
      unlocking.current = null;
    };
  }, [getToken, isLoaded, isSignedIn, loaded.locked, openSignIn, slug]);

  if (album.locked) {
    const waitingForSession = isLoaded && isSignedIn && !unlockFailed;
    return (
      <Shell>
        <section className="page page-wide">
          <h1 className="page-title">{album.title}</h1>
          <p className="empty">{waitingForSession ? "載入相簿中…" : "請先登入才能查看這本相簿。"}</p>
        </section>
      </Shell>
    );
  }

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
