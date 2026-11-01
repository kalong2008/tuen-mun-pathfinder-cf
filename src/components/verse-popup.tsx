import { useEffect, useState } from "react";

type VerseData = {
  citation: string;
  passage: string;
  image: string | null;
  version: string;
  width: number | null;
  height: number | null;
};

export function VersePopup() {
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/bible/cached", { signal: controller.signal });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = (await response.json()) as VerseData & { error?: string };
        if (data.error || !data.passage) {
          setVerse(null);
        } else {
          setVerse(data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching cached verse:", error);
        setVerse(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="verse-overlay" role="presentation">
      <div
        className="verse-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verse-title"
      >
        <button type="button" className="verse-close" onClick={() => setIsOpen(false)}>
          <span aria-hidden="true">✕</span>
          <span className="sr">關閉今日經文</span>
        </button>
        <h2 id="verse-title">今日經文</h2>
        {loading ? (
          <div className="verse-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : verse ? (
          <div>
            {verse.image ? (
              <img
                src={verse.image}
                alt="今日經文"
                width={verse.width ?? 640}
                height={verse.height ?? 640}
              />
            ) : null}
            <p className="verse-cite">{verse.citation}</p>
            <p className="verse-passage">{verse.passage}</p>
            <p className="verse-version">{verse.version}</p>
          </div>
        ) : (
          <p className="verse-missing">Failed to load verse</p>
        )}
      </div>
    </div>
  );
}
