import { honorCategories, type AdventurerHonor, type HonorCategory } from "../data/types";

const ROMAN_NUMERAL_SUFFIX = /\s+(I{1,3}|IV|V|VI|VII|VIII|IX|X)\s*$/i;

const ROMAN_NUMERAL_VALUES: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
};

interface HonorSeriesInfo {
  base: string;
  level: number | null;
}

function parseHonorSeries(honor: AdventurerHonor): HonorSeriesInfo {
  const names = [honor.nameEn, honor.nameZh].filter(Boolean) as string[];

  for (const name of names) {
    const match = name.match(ROMAN_NUMERAL_SUFFIX);
    if (match) {
      const base = name.slice(0, match.index).trim().toLowerCase();
      const level = ROMAN_NUMERAL_VALUES[match[1].toUpperCase()];

      return { base, level: level ?? null };
    }
  }

  return { base: honor.id, level: null };
}

function sortCategoryHonors(honors: AdventurerHonor[]): AdventurerHonor[] {
  const groups: { honors: AdventurerHonor[]; firstIndex: number }[] = [];
  const groupIndexByKey = new Map<string, number>();

  honors.forEach((honor, index) => {
    const { base, level } = parseHonorSeries(honor);
    const groupKey = level === null ? honor.id : base;

    let groupIndex = groupIndexByKey.get(groupKey);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      groupIndexByKey.set(groupKey, groupIndex);
      groups.push({ honors: [], firstIndex: index });
    }

    groups[groupIndex].honors.push(honor);
  });

  groups.sort((left, right) => left.firstIndex - right.firstIndex);

  return groups.flatMap((group) =>
    [...group.honors].sort((left, right) => {
      const leftLevel = parseHonorSeries(left).level ?? 0;
      const rightLevel = parseHonorSeries(right).level ?? 0;

      return leftLevel - rightLevel;
    }),
  );
}

export type HonorSortField = "default" | "nameZh" | "nameEn" | "code";

export function sortHonorsByField(honors: AdventurerHonor[], field: HonorSortField): AdventurerHonor[] {
  if (field === "default") {
    return honors;
  }

  const sorted = [...honors];

  sorted.sort((left, right) => {
    switch (field) {
      case "nameZh":
        return left.nameZh.localeCompare(right.nameZh, "zh-Hant");
      case "nameEn":
        return (left.nameEn ?? "").localeCompare(right.nameEn ?? "", "en");
      case "code":
        return left.code.localeCompare(right.code, "en", { numeric: true });
      default: {
        const unhandledField: never = field;
        return unhandledField;
      }
    }
  });

  return sorted;
}

export function sortAdventurerHonors(honors: AdventurerHonor[]): AdventurerHonor[] {
  const honorsByCategory = new Map<HonorCategory, AdventurerHonor[]>();

  for (const honor of honors) {
    const categoryHonors = honorsByCategory.get(honor.category) ?? [];
    categoryHonors.push(honor);
    honorsByCategory.set(honor.category, categoryHonors);
  }

  return honorCategories.flatMap((category) =>
    sortCategoryHonors(honorsByCategory.get(category.id) ?? []),
  );
}

export { parseHonorSeries };
