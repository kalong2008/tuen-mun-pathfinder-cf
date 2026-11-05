import hkmcSourceUrls from "../../reference/hkmc-source-urls.json";

export const answerSourceKinds = ["translated", "draft"] as const;

export type HonorAnswerSourceKind = (typeof answerSourceKinds)[number];

const honorCategoryMeta = [
  { id: "community", label: "社區關懷" },
  { id: "arts-crafts", label: "美術工藝" },
  { id: "household", label: "家事技藝" },
  { id: "nature", label: "自然研究" },
  { id: "recreation", label: "康樂活動" },
  { id: "spiritual", label: "屬靈生活" },
] as const;

export type HonorCategory = (typeof honorCategoryMeta)[number]["id"];
export type HonorCategoryFilter = HonorCategory | "all";
export type HonorStatus = "non-review" | "reviewed";

export const honorCategories = honorCategoryMeta.map(({ id, label }) => ({
  id,
  label,
  sourceUrl: hkmcSourceUrls.categoryPages[id],
}));

export const honorReviewStatuses: { id: HonorStatus; label: string }[] = [
  { id: "non-review", label: "待核對" },
  { id: "reviewed", label: "已核對" },
];

export interface HonorAnswer {
  requirementIndex: number;
  text: string;
}

export interface HonorPageAnswer {
  requirementIndex: number;
  html: string;
}

export interface HonorHandbooks {
  zh: boolean;
  en: boolean;
}

export interface HonorPageRecord {
  id: string;
  code: string;
  nameZh: string;
  nameEn?: string;
  aliases: string[];
  category: HonorCategory;
  status: HonorStatus;
  answerSource: HonorAnswerSourceKind;
  answerSourceNote?: string;
  requirementsHtml: string;
  answerPrefaceHtml: string;
  answers: HonorPageAnswer[];
  searchText: string;
  badgeUrl?: string;
  docxUrl?: string;
  pdfZhUrl?: string;
  pdfEnUrl?: string;
  canvaViewUrl?: string;
  canvaPdfUrl?: string;
}

export interface AdventurerHonor {
  id: string;
  code: string;
  nameZh: string;
  nameEn?: string;
  aliases: string[];
  category: HonorCategory;
  requirementsMarkdown: string;
  answers: HonorAnswer[];
  hasDocxDownload: boolean;
  answerSource: HonorAnswerSourceKind;
  answerSourceNote?: string;
  status: HonorStatus;
}
