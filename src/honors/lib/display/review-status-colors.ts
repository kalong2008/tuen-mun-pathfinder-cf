import type { HonorStatus } from "../data/types";

export interface HonorReviewStatusColor {
  badgeBg: string;
  badgeText: string;
}

/** Kept distinct from category accents (red, yellow, green, blue, purple, red-purple). */
export const honorReviewStatusColors = {
  "non-review": {
    badgeBg: "#ffedd5",
    badgeText: "#9a3412",
  },
  reviewed: {
    badgeBg: "#e0f2fe",
    badgeText: "#075985",
  },
} satisfies Record<HonorStatus, HonorReviewStatusColor>;

export function getHonorReviewStatusColors(status: HonorStatus): HonorReviewStatusColor {
  return honorReviewStatusColors[status];
}
