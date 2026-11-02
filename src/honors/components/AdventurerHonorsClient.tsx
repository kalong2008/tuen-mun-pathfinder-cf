import "../honors.css";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Download, ExternalLink, Presentation, X } from "lucide-react";
import { FaFilePdf, FaFileWord } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";

import { getHonorCategoryColors } from "../lib/display/category-colors";
import { getHonorReviewStatusColors } from "../lib/display/review-status-colors";
import { honorMarkdownClassName } from "../lib/markdown/honor-markdown";
import { filterHonors, getAnswerSourceLabel, getHonorStats } from "../lib/display/search";
import { sortHonorsByField, type HonorSortField } from "../lib/display/sort";
import {
  honorCategories,
  honorReviewStatuses,
  type HonorCategory,
  type HonorHandbooks,
  type HonorPageRecord,
  type HonorStatus,
} from "../lib/data/types";

const sortOptions: { value: HonorSortField; label: string }[] = [
  { value: "default", label: "手冊分類及級別" },
  { value: "nameZh", label: "中文名稱" },
  { value: "nameEn", label: "英文名稱" },
  { value: "code", label: "編號" },
];

function HonorCategoryTag({ category }: { category: HonorCategory }) {
  const label = honorCategories.find((item) => item.id === category)?.label;
  const colors = getHonorCategoryColors(category);

  if (!label) {
    return null;
  }

  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
    >
      {label}
    </span>
  );
}

function HonorHtml({ html }: { html: string }) {
  if (!html.trim()) return null;
  return <div className={honorMarkdownClassName} dangerouslySetInnerHTML={{ __html: html }} />;
}

function HonorReviewTag({ honor }: { honor: HonorPageRecord }) {
  const colors = getHonorReviewStatusColors(honor.status);
  const label = honor.status === "reviewed" ? "已核對" : "待核對";

  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
    >
      {label}
    </span>
  );
}

function HonorBadge({
  honor,
  size = "card",
}: {
  honor: HonorPageRecord;
  size?: "card" | "modal";
}) {
  const imageUrl = honor.badgeUrl;
  if (!imageUrl) {
    return null;
  }

  const dimensions = size === "modal" ? { width: 160, height: 120 } : { width: 96, height: 72 };

  return (
    <img
      src={imageUrl}
      alt={`${honor.nameZh} 榮譽證`}
      width={dimensions.width}
      height={dimensions.height}
      className={`shrink-0 rounded-lg object-contain ${size === "card" ? "mx-auto" : ""}`}
    />
  );
}

function HonorDetails({ honor }: { honor: HonorPageRecord }) {
  const hasAnswers = honor.answerPrefaceHtml.trim().length > 0 || honor.answers.length > 0;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">中文要求</h3>
        {honor.requirementsHtml ? (
          <HonorHtml html={honor.requirementsHtml} />
        ) : (
          <p className="text-gray-500">暫未有中文要求。</p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">答案整理</h3>
        {hasAnswers ? (
          <div className="space-y-3">
            <HonorHtml html={honor.answerPrefaceHtml} />
            {honor.answers.length > 0 ? (
              <ul className="space-y-3">
                {honor.answers.map((answer) => (
                  <li key={answer.requirementIndex} className="rounded-xl bg-gray-50 p-4">
                    <p className="mb-2 text-sm font-medium text-gray-500">
                      要求 {answer.requirementIndex + 1}
                    </p>
                    <HonorHtml html={answer.html} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="text-gray-500">暫未有答案整理。</p>
        )}
      </section>

      <p className="text-sm text-gray-500">{getAnswerSourceLabel(honor)}</p>
    </div>
  );
}

function HonorModal({
  honor,
  onClose,
}: {
  honor: HonorPageRecord;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const downloadUrl = honor.docxUrl;
  const pdfLinks = { zh: honor.pdfZhUrl, en: honor.pdfEnUrl };
  const hasDownloads = Boolean(downloadUrl || pdfLinks.zh || pdfLinks.en || honor.canvaViewUrl || honor.canvaPdfUrl);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";

    const getFocusableElements = () => {
      if (!dialog) {
        return [] as HTMLElement[];
      }

      return [...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hasAttribute("disabled"));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="honor-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <motion.button
          type="button"
          onClick={onClose}
          aria-label="關閉"
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <X className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </motion.button>

        <div className="flex items-start gap-4 border-b border-gray-100 px-5 py-4 pr-14 text-left">
          <HonorBadge honor={honor} size="modal" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-blue-700">{honor.code}</p>
              <HonorReviewTag honor={honor} />
              <HonorCategoryTag category={honor.category} />
            </div>
            <h2 id="honor-modal-title" className="text-xl font-semibold text-gray-900">
              {honor.nameZh}
            </h2>
            {honor.nameEn && <p className="text-sm text-gray-500">{honor.nameEn}</p>}
            {hasDownloads && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {honor.canvaViewUrl && (
                  <a
                    href={honor.canvaViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                  >
                    <Presentation className="h-4 w-4" aria-hidden="true" />
                    閱讀簡報
                  </a>
                )}
                {honor.canvaPdfUrl && (
                  <a
                    href={honor.canvaPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                  >
                    <FaFilePdf className="h-4 w-4" aria-hidden="true" />
                    下載簡報 PDF
                  </a>
                )}
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                  >
                    <FaFileWord className="h-4 w-4" aria-hidden="true" />
                    中文 Word（HKMC 2023）
                  </a>
                )}
                {pdfLinks.zh && (
                  <a
                    href={pdfLinks.zh}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                  >
                    <FaFilePdf className="h-4 w-4" aria-hidden="true" />
                    中文 PDF（HKMC 2023）
                  </a>
                )}
                {pdfLinks.en && (
                  <a
                    href={pdfLinks.en}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                  >
                    <FaFilePdf className="h-4 w-4" aria-hidden="true" />
                    英文 PDF （GC 2020）
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-6">
          <HonorDetails honor={honor} />
        </div>
      </div>
    </motion.div>
  );
}

function HonorSortSelect({
  sortField,
  onChange,
}: {
  sortField: HonorSortField;
  onChange: (value: HonorSortField) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-end gap-2">
      <label htmlFor="honor-sort" className="text-sm text-gray-700">
        排序
      </label>
      <select
        id="honor-sort"
        value={sortField}
        onChange={(event) => onChange(event.target.value as HonorSortField)}
        className="bg-transparent text-sm text-gray-700"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-transparent">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CategoryChecklist({
  selectedCategories,
  onToggle,
  idPrefix,
}: {
  selectedCategories: HonorCategory[];
  onToggle: (category: HonorCategory) => void;
  idPrefix: string;
}) {
  return (
    <ul className="space-y-2">
      {honorCategories.map((option) => {
        const inputId = `${idPrefix}-${option.id}`;
        const colors = getHonorCategoryColors(option.id);

        return (
          <li key={option.id}>
            <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                id={inputId}
                type="checkbox"
                checked={selectedCategories.includes(option.id)}
                onChange={() => onToggle(option.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
              />
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
              <span>{option.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function ReviewStatusChecklist({
  selectedReviewStatuses,
  onToggle,
  idPrefix,
}: {
  selectedReviewStatuses: HonorStatus[];
  onToggle: (status: HonorStatus) => void;
  idPrefix: string;
}) {
  return (
    <ul className="space-y-2">
      {honorReviewStatuses.map((option) => {
        const inputId = `${idPrefix}-${option.id}`;

        return (
          <li key={option.id}>
            <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                id={inputId}
                type="checkbox"
                checked={selectedReviewStatuses.includes(option.id)}
                onChange={() => onToggle(option.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
              />
              <span>{option.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function HonorFiltersPanel({
  query,
  onQueryChange,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  categoryMenuOpen,
  onCategoryMenuOpenChange,
  selectedReviewStatuses,
  onToggleReviewStatus,
  onClearReviewStatuses,
  reviewMenuOpen,
  onReviewMenuOpenChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  selectedCategories: HonorCategory[];
  onToggleCategory: (category: HonorCategory) => void;
  onClearCategories: () => void;
  categoryMenuOpen: boolean;
  onCategoryMenuOpenChange: (open: boolean) => void;
  selectedReviewStatuses: HonorStatus[];
  onToggleReviewStatus: (status: HonorStatus) => void;
  onClearReviewStatuses: () => void;
  reviewMenuOpen: boolean;
  onReviewMenuOpenChange: (open: boolean) => void;
}) {
  const categorySummary =
    selectedCategories.length === 0
      ? "全部分類"
      : honorCategories
          .filter((option) => selectedCategories.includes(option.id))
          .map((option) => option.label)
          .join("、");

  const reviewSummary =
    selectedReviewStatuses.length === 0
      ? "全部狀態"
      : honorReviewStatuses
          .filter((option) => selectedReviewStatuses.includes(option.id))
          .map((option) => option.label)
          .join("、");

  const mobileFilterButtonClass =
    "flex min-w-0 flex-1 items-center justify-between gap-1 rounded-xl border border-gray-300 px-2.5 py-2.5 text-left text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  const mobileFilterClearButtonClass =
    "shrink-0 rounded-xl px-2.5 py-2.5 text-xs font-medium text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-gray-400";

  const filterClearButtonClass =
    "text-xs font-medium text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:text-gray-400";

  const mobileFiltersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryMenuOpen && !reviewMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || mobileFiltersRef.current?.contains(target)) {
        return;
      }

      onCategoryMenuOpenChange(false);
      onReviewMenuOpenChange(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [categoryMenuOpen, reviewMenuOpen, onCategoryMenuOpenChange, onReviewMenuOpenChange]);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-[84px] lg:space-y-5">
      <div>
        <label htmlFor="honor-search" className="block text-sm font-medium text-gray-700">
          搜尋榮譽證
        </label>
        <input
          id="honor-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="搜尋 code、中文名、英文名、要求或答案"
        />
      </div>

      <div ref={mobileFiltersRef} className="relative lg:static">
        <div className="flex gap-2 lg:hidden">
          <div className="flex min-w-0 flex-1 items-stretch gap-1">
            <button
              type="button"
              aria-expanded={categoryMenuOpen}
              aria-controls="honor-category-menu-mobile"
              onClick={() => {
                onCategoryMenuOpenChange(!categoryMenuOpen);
                if (!categoryMenuOpen) {
                  onReviewMenuOpenChange(false);
                }
              }}
              className={mobileFilterButtonClass}
            >
              <span className="truncate">{categorySummary}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition ${categoryMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onClearCategories}
              disabled={selectedCategories.length === 0}
              aria-label="清除分類"
              className={mobileFilterClearButtonClass}
            >
              清除
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-stretch gap-1">
            <button
              type="button"
              aria-expanded={reviewMenuOpen}
              aria-controls="honor-review-menu-mobile"
              onClick={() => {
                onReviewMenuOpenChange(!reviewMenuOpen);
                if (!reviewMenuOpen) {
                  onCategoryMenuOpenChange(false);
                }
              }}
              className={mobileFilterButtonClass}
            >
              <span className="truncate">{reviewSummary}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition ${reviewMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onClearReviewStatuses}
              disabled={selectedReviewStatuses.length === 0}
              aria-label="清除核對狀態"
              className={mobileFilterClearButtonClass}
            >
              清除
            </button>
          </div>
        </div>

        {categoryMenuOpen ? (
          <div
            id="honor-category-menu-mobile"
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-lg lg:hidden"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-gray-500">可多選</p>
              <button
                type="button"
                onClick={onClearCategories}
                disabled={selectedCategories.length === 0}
                className={filterClearButtonClass}
              >
                清除
              </button>
            </div>
            <CategoryChecklist
              idPrefix="honor-category-mobile"
              selectedCategories={selectedCategories}
              onToggle={onToggleCategory}
            />
          </div>
        ) : null}

        {reviewMenuOpen ? (
          <div
            id="honor-review-menu-mobile"
            className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg lg:hidden"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-gray-500">可多選</p>
              <button
                type="button"
                onClick={onClearReviewStatuses}
                disabled={selectedReviewStatuses.length === 0}
                className={filterClearButtonClass}
              >
                清除
              </button>
            </div>
            <ReviewStatusChecklist
              idPrefix="honor-review-status-mobile"
              selectedReviewStatuses={selectedReviewStatuses}
              onToggle={onToggleReviewStatus}
            />
          </div>
        ) : null}
      </div>

      <div className="hidden lg:block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700">核對狀態</p>
          <button
            type="button"
            onClick={onClearReviewStatuses}
            disabled={selectedReviewStatuses.length === 0}
            className={filterClearButtonClass}
          >
            清除
          </button>
        </div>
        <ReviewStatusChecklist
          idPrefix="honor-review-status-desktop"
          selectedReviewStatuses={selectedReviewStatuses}
          onToggle={onToggleReviewStatus}
        />
      </div>

      <div className="hidden lg:block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700">分類</p>
          <button
            type="button"
            onClick={onClearCategories}
            disabled={selectedCategories.length === 0}
            className={filterClearButtonClass}
          >
            清除
          </button>
        </div>
        <CategoryChecklist
          idPrefix="honor-category-desktop"
          selectedCategories={selectedCategories}
          onToggle={onToggleCategory}
        />
      </div>
    </div>
  );
}

const handbookLinks = [
  { slot: "zh", label: "中文榮譽證手冊（HKMC 2023）" },
  { slot: "en", label: "英文榮譽證手冊（GC 2020）" },
] as const;

export function AdventurerHonorsClient({
  honors,
  handbooks,
  canvaConnected,
}: {
  honors: HonorPageRecord[];
  handbooks: HonorHandbooks;
  canvaConnected: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<HonorCategory[]>([]);
  const [selectedReviewStatuses, setSelectedReviewStatuses] = useState<HonorStatus[]>([]);
  const [sortField, setSortField] = useState<HonorSortField>("default");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [reviewMenuOpen, setReviewMenuOpen] = useState(false);
  const [selectedHonorId, setSelectedHonorId] = useState<string | null>(null);

  const filteredHonors = useMemo(() => {
    const filtered = filterHonors(honors, {
      categories: selectedCategories,
      reviewStatuses: selectedReviewStatuses,
      query,
    });
    return sortHonorsByField(filtered, sortField);
  }, [honors, query, selectedCategories, selectedReviewStatuses, sortField]);
  const honorStats = useMemo(() => getHonorStats(honors), [honors]);
  const filteredStats = useMemo(() => getHonorStats(filteredHonors), [filteredHonors]);
  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedReviewStatuses.length > 0;
  const selectedHonor = useMemo(
    () => honors.find((honor) => honor.id === selectedHonorId) ?? null,
    [honors, selectedHonorId],
  );
  const visibleCategoryLinks = useMemo(
    () =>
      selectedCategories.length === 0
        ? honorCategories
        : honorCategories.filter((option) => selectedCategories.includes(option.id)),
    [selectedCategories],
  );

  const toggleCategory = (category: HonorCategory) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const toggleReviewStatus = (status: HonorStatus) => {
    setSelectedReviewStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedReviewStatuses([]);
    setSortField("default");
    setCategoryMenuOpen(false);
    setReviewMenuOpen(false);
  };

  return (
    <div className="honors min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 px-4 pb-14 pt-[84px]">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-md md:p-10">
          <p className="mb-3 text-sm font-semibold text-blue-700">Adventurer Honors</p>
          <h1 className="text-3xl font-bold text-gray-900 md:text-5xl">幼鋒會榮譽證</h1>
          <p className="mt-4 max-w-3xl text-gray-600">
            搜尋幼鋒會榮譽證的中文要求及答案整理。答案取自英文 Award Book 2020 或以 AI
            草擬／翻譯，請導師按需要核對使用。
          </p>
          <p className="mt-3 text-sm text-gray-600" aria-live="polite">
            {honorStats.total} 個榮譽 · {honorStats.nonReview} 待核對 · {honorStats.reviewed} 已核對
            {hasActiveFilters && filteredStats.total !== honorStats.total
              ? ` · 目前顯示 ${filteredStats.total} 個`
              : ""}
          </p>

          <div className="mt-6 space-y-5 border-t border-gray-100 pt-6">
            {handbooks.zh || handbooks.en ? (
              <section>
                <h2 className="text-sm font-semibold text-gray-900">榮譽證手冊</h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {handbookLinks.map((handbook) =>
                    handbooks[handbook.slot] ? (
                      <a
                        key={handbook.slot}
                        href={`/api/adventurer-honors/handbooks/${handbook.slot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        {handbook.label}
                      </a>
                    ) : null,
                  )}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="text-sm font-semibold text-gray-900">Canva 簡報</h2>
              {canvaConnected ? (
                <p className="mt-2 text-sm text-gray-600">
                  已連接。有設計 ID 的榮譽證可以閱讀簡報或下載 PDF。
                </p>
              ) : (
                <a
                  href="/api/canva/oauth/start"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                >
                  連接 Canva
                </a>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-900">HKMC 榮譽證分類來源</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {visibleCategoryLinks.map((option) => {
                  const colors = getHonorCategoryColors(option.id);

                  return (
                    <li key={option.id}>
                      <a
                        href={option.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition hover:brightness-95"
                        style={{ backgroundColor: colors.pillBg, color: colors.pillText }}
                      >
                        {option.label}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <HonorFiltersPanel
            query={query}
            onQueryChange={setQuery}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onClearCategories={() => setSelectedCategories([])}
            categoryMenuOpen={categoryMenuOpen}
            onCategoryMenuOpenChange={setCategoryMenuOpen}
            selectedReviewStatuses={selectedReviewStatuses}
            onToggleReviewStatus={toggleReviewStatus}
            onClearReviewStatuses={() => setSelectedReviewStatuses([])}
            reviewMenuOpen={reviewMenuOpen}
            onReviewMenuOpenChange={setReviewMenuOpen}
          />

          <div>
            <HonorSortSelect sortField={sortField} onChange={setSortField} />
            {honors.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
                <p>尚未同步榮譽證。</p>
              </div>
            ) : filteredHonors.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
                <p className="mb-4">找不到相關榮譽證。</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-gray-900 px-5 py-2 text-white"
                >
                  清除搜尋
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:gap-4">
                {filteredHonors.map((honor) => {
                  const colors = getHonorCategoryColors(honor.category);

                  return (
                  <button
                    key={honor.id}
                    type="button"
                    onClick={() => setSelectedHonorId(honor.id)}
                    className="flex flex-col items-center rounded-2xl p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ backgroundColor: colors.cardBg }}
                  >
                    <HonorBadge honor={honor} />
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
                      <p className="text-xs font-semibold text-blue-700">{honor.code}</p>
                      <HonorReviewTag honor={honor} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                      {honor.nameZh}
                    </p>
                    {honor.nameEn && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{honor.nameEn}</p>
                    )}
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedHonor ? (
          <HonorModal
            key={selectedHonor.id}
            honor={selectedHonor}
            onClose={() => setSelectedHonorId(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
