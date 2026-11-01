import type { HonorCategory } from "../data/types";

export interface HonorCategoryColor {
  accent: string;
  badgeBg: string;
  badgeText: string;
  cardBg: string;
  pillBg: string;
  pillText: string;
  pillHoverBg: string;
}

export const honorCategoryColors = {
  community: {
    accent: "#933366",
    badgeBg: "#9333661f",
    badgeText: "#6b2449",
    cardBg: "#9333661a",
    pillBg: "#9333661a",
    pillText: "#6b2449",
    pillHoverBg: "#93336633",
  },
  "arts-crafts": {
    accent: "#ca8a04",
    badgeBg: "#ca8a041f",
    badgeText: "#854d0e",
    cardBg: "#ca8a041a",
    pillBg: "#ca8a041a",
    pillText: "#854d0e",
    pillHoverBg: "#ca8a0433",
  },
  household: {
    accent: "#dc2626",
    badgeBg: "#dc26261f",
    badgeText: "#991b1b",
    cardBg: "#dc26261a",
    pillBg: "#dc26261a",
    pillText: "#991b1b",
    pillHoverBg: "#dc262633",
  },
  nature: {
    accent: "#16a34a",
    badgeBg: "#16a34a1f",
    badgeText: "#166534",
    cardBg: "#16a34a1a",
    pillBg: "#16a34a1a",
    pillText: "#166534",
    pillHoverBg: "#16a34a33",
  },
  recreation: {
    accent: "#2563eb",
    badgeBg: "#2563eb1f",
    badgeText: "#1e40af",
    cardBg: "#2563eb1a",
    pillBg: "#2563eb1a",
    pillText: "#1e40af",
    pillHoverBg: "#2563eb33",
  },
  spiritual: {
    accent: "#7c3aed",
    badgeBg: "#7c3aed1f",
    badgeText: "#5b21b6",
    cardBg: "#7c3aed1a",
    pillBg: "#7c3aed1a",
    pillText: "#5b21b6",
    pillHoverBg: "#7c3aed33",
  },
} satisfies Record<HonorCategory, HonorCategoryColor>;

export function getHonorCategoryColors(category: HonorCategory): HonorCategoryColor {
  return honorCategoryColors[category];
}
