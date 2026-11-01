export function noticePdfUrl(id: string, target: string): string | null {
  if (target === "前鋒會") return `/api/notices/${id}/file/pathfinder`;
  if (target === "幼鋒會") return `/api/notices/${id}/file/adventurer`;
  return null;
}

export function noticeFiles(notice: { id: string; target: string[]; pdfUrls: string[] }) {
  const stored = notice.pdfUrls.flatMap((url, index) => {
    const target = notice.target[index] ?? "";
    return url ? [{ url, target }] : [];
  });
  if (stored.length > 0) return stored;
  return notice.target.flatMap((target) => {
    const url = noticePdfUrl(notice.id, target);
    return url ? [{ url, target }] : [];
  });
}
