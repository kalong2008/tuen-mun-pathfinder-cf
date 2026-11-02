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

export function photoDisplayUrl(pathOrUrl: string, width: number) {
  const source = photoUrl(pathOrUrl);
  const prefix = `${PHOTO_BASE}/`;
  if (!source.startsWith(prefix)) return source;
  const remote = `https://${PHOTO_HOST}/${source.slice(prefix.length)}`;
  return `${TRANSFORM_ORIGIN}/cdn-cgi/image/width=${width},fit=scale-down,format=auto/${remote}`;
}

export function albumManifestUrl(slug: string) {
  const year = slug.slice(0, 4);
  return `${PHOTO_BASE}/photo/${year}/${slug}/${slug}.json`;
}
