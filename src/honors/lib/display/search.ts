import {
  ANSWER_SOURCE_DRAFTED,
  ANSWER_SOURCE_PENDING,
  ANSWER_SOURCE_TRANSLATED,
  getAnswerSourceLabel,
} from "../data/answer-source";
import type { HonorCategory, HonorPageRecord, HonorStatus } from "../data/types";

export { ANSWER_SOURCE_DRAFTED, ANSWER_SOURCE_PENDING, ANSWER_SOURCE_TRANSLATED, getAnswerSourceLabel };

export interface HonorFilters {
  categories: HonorCategory[];
  reviewStatuses: HonorStatus[];
  query: string;
}

export interface HonorStats {
  total: number;
  nonReview: number;
  reviewed: number;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function filterHonors(honors: HonorPageRecord[], filters: HonorFilters) {
  const query = normalize(filters.query);

  return honors.filter((honor) => {
    const matchesCategory =
      filters.categories.length === 0 || filters.categories.includes(honor.category);
    const matchesReviewStatus =
      filters.reviewStatuses.length === 0 || filters.reviewStatuses.includes(honor.status);
    const matchesQuery = query.length === 0 || normalize(honor.searchText).includes(query);

    return matchesCategory && matchesReviewStatus && matchesQuery;
  });
}

export function getHonorStats(honors: HonorPageRecord[]): HonorStats {
  const initialCounts: Record<HonorStatus, number> = {
    "non-review": 0,
    reviewed: 0,
  };

  const counts = honors.reduce((result, honor) => {
    result[honor.status] += 1;
    return result;
  }, initialCounts);

  return {
    total: honors.length,
    nonReview: counts["non-review"],
    reviewed: counts.reviewed,
  };
}
