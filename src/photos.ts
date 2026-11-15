import covers from "../db/album-covers.json";

const PHOTO_BASE = "https://storage.googleapis.com/tuenmunpathfinder-storage";
const PHOTO_HOST = "tuenmunpathfinder-storage.storage.googleapis.com";
const TRANSFORM_ORIGIN = "https://tuenmunpathfinder.com";
const coverByHref = covers as Record<string, string>;

export function coverFor(href: string) {
  return coverByHref[href] ?? null;
}

export function photoUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${PHOTO_BASE}/${pathOrUrl.replace(/^\//, "")}`;
}

export function photoDisplayUrl(pathOrUrl: string, width: number, quality?: number) {
  const source = photoUrl(pathOrUrl);
  const prefix = `${PHOTO_BASE}/`;
  if (!source.startsWith(prefix)) return source;
  const remote = `https://${PHOTO_HOST}/${source.slice(prefix.length)}`;
  const qualityOption = quality ? `,quality=${quality}` : "";
  return `${TRANSFORM_ORIGIN}/cdn-cgi/image/width=${width},fit=scale-down,format=auto${qualityOption}/${remote}`;
}

export type PhotoSource = {
  src: string;
  width: number;
  height: number;
};

const ALBUM_GRID_VARIANTS = [
  { width: 480, quality: 70 },
  { width: 800, quality: 75 },
  { width: 1200, quality: 75 },
] as const;

const ALBUM_VIEW_VARIANTS = [
  { width: 1200, quality: 75 },
  { width: 1600, quality: 80 },
  { width: 2400, quality: 80 },
] as const;

function variantSources(
  pathOrUrl: string,
  intrinsicWidth: number,
  intrinsicHeight: number,
  variants: readonly { width: number; quality?: number }[],
) {
  const safeWidth = intrinsicWidth > 0 ? intrinsicWidth : 1;
  const safeHeight = intrinsicHeight > 0 ? intrinsicHeight : 1;
  return variants.map(({ width, quality }) => ({
    src: photoDisplayUrl(pathOrUrl, width, quality),
    width,
    height: Math.max(1, Math.round((safeHeight * width) / safeWidth)),
  }));
}

export function albumGridSources(pathOrUrl: string, width: number, height: number) {
  const srcSet = variantSources(pathOrUrl, width, height, ALBUM_GRID_VARIANTS);
  return { src: srcSet[srcSet.length - 1].src, srcSet };
}

export function albumViewSources(pathOrUrl: string, width: number, height: number) {
  const srcSet = variantSources(pathOrUrl, width, height, ALBUM_VIEW_VARIANTS);
  return { src: srcSet[srcSet.length - 1].src, srcSet };
}

export function albumManifestUrl(slug: string) {
  const year = slug.slice(0, 4);
  return `${PHOTO_BASE}/photo/${year}/${slug}/${slug}.json`;
}
