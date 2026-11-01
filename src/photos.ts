import covers from "../db/album-covers.json";

const PHOTO_BASE = "https://storage.googleapis.com/tuenmunpathfinder-storage";
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

export function albumManifestUrl(slug: string) {
  const year = slug.slice(0, 4);
  return `${PHOTO_BASE}/photo/${year}/${slug}/${slug}.json`;
}
