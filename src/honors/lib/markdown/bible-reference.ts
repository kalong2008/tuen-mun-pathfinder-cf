/** YouVersion 和合本修訂版 (RCUV), same version used by /api/bible. */
export const YOUVERSION_RCUV = {
  versionId: 139,
  abbreviation: "RCUV",
} as const;

const BIBLE_BOOKS: { name: string; usfm: string }[] = [
  { name: "哥林多前書", usfm: "1CO" },
  { name: "哥林多後書", usfm: "2CO" },
  { name: "帖撒羅尼迦前書", usfm: "1TH" },
  { name: "帖撒羅尼迦後書", usfm: "2TH" },
  { name: "撒母耳記上", usfm: "1SA" },
  { name: "撒母耳記下", usfm: "2SA" },
  { name: "提摩太前書", usfm: "1TI" },
  { name: "提摩太後書", usfm: "2TI" },
  { name: "彼得前書", usfm: "1PE" },
  { name: "彼得後書", usfm: "2PE" },
  { name: "約翰一書", usfm: "1JN" },
  { name: "約翰二書", usfm: "2JN" },
  { name: "約翰三書", usfm: "3JN" },
  { name: "列王紀上", usfm: "1KI" },
  { name: "列王紀下", usfm: "2KI" },
  { name: "列王記上", usfm: "1KI" },
  { name: "列王記下", usfm: "2KI" },
  { name: "歷代志上", usfm: "1CH" },
  { name: "歷代志下", usfm: "2CH" },
  { name: "歷代誌上", usfm: "1CH" },
  { name: "歷代誌下", usfm: "2CH" },
  { name: "馬太福音", usfm: "MAT" },
  { name: "馬可福音", usfm: "MRK" },
  { name: "路加福音", usfm: "LUK" },
  { name: "約翰福音", usfm: "JHN" },
  { name: "使徒行傳", usfm: "ACT" },
  { name: "創世記", usfm: "GEN" },
  { name: "出埃及記", usfm: "EXO" },
  { name: "利未記", usfm: "LEV" },
  { name: "民數記", usfm: "NUM" },
  { name: "申命記", usfm: "DEU" },
  { name: "約書亞記", usfm: "JOS" },
  { name: "士師記", usfm: "JDG" },
  { name: "以斯帖記", usfm: "EST" },
  { name: "尼希米記", usfm: "NEH" },
  { name: "以賽亞書", usfm: "ISA" },
  { name: "耶利米書", usfm: "JER" },
  { name: "以西結書", usfm: "EZK" },
  { name: "但以理書", usfm: "DAN" },
  { name: "西番雅書", usfm: "ZEP" },
  { name: "撒迦利亞書", usfm: "ZEC" },
  { name: "腓立比書", usfm: "PHP" },
  { name: "加拉太書", usfm: "GAL" },
  { name: "歌羅西書", usfm: "COL" },
  { name: "希伯來書", usfm: "HEB" },
  { name: "傳道書", usfm: "ECC" },
  { name: "約珥書", usfm: "JOL" },
  { name: "瑪拉基書", usfm: "MAL" },
  { name: "羅馬書", usfm: "ROM" },
  { name: "雅各書", usfm: "JAS" },
  { name: "箴言", usfm: "PRO" },
  { name: "啟示錄", usfm: "REV" },
  { name: "路得記", usfm: "RUT" },
  { name: "以斯拉記", usfm: "EZR" },
  { name: "約伯記", usfm: "JOB" },
  { name: "雅歌", usfm: "SNG" },
  { name: "何西阿書", usfm: "HOS" },
  { name: "阿摩司書", usfm: "AMO" },
  { name: "俄巴底亞書", usfm: "OBA" },
  { name: "約拿書", usfm: "JON" },
  { name: "彌迦書", usfm: "MIC" },
  { name: "那鴻書", usfm: "NAM" },
  { name: "哈巴谷書", usfm: "HAB" },
  { name: "哈該書", usfm: "HAG" },
  { name: "猶大書", usfm: "JUD" },
  { name: "以弗所書", usfm: "EPH" },
  { name: "提多書", usfm: "TIT" },
  { name: "腓利門書", usfm: "PHM" },
  { name: "林前", usfm: "1CO" },
  { name: "林後", usfm: "2CO" },
  { name: "帖前", usfm: "1TH" },
  { name: "帖後", usfm: "2TH" },
  { name: "撒上", usfm: "1SA" },
  { name: "撒下", usfm: "2SA" },
  { name: "提前", usfm: "1TI" },
  { name: "提後", usfm: "2TI" },
  { name: "彼前", usfm: "1PE" },
  { name: "彼後", usfm: "2PE" },
  { name: "約一", usfm: "1JN" },
  { name: "約二", usfm: "2JN" },
  { name: "約三", usfm: "3JN" },
  { name: "王上", usfm: "1KI" },
  { name: "王下", usfm: "2KI" },
  { name: "代上", usfm: "1CH" },
  { name: "代下", usfm: "2CH" },
  { name: "創", usfm: "GEN" },
  { name: "出", usfm: "EXO" },
  { name: "利", usfm: "LEV" },
  { name: "民", usfm: "NUM" },
  { name: "申", usfm: "DEU" },
  { name: "書", usfm: "JOS" },
  { name: "士", usfm: "JDG" },
  { name: "得", usfm: "RUT" },
  { name: "斯", usfm: "EST" },
  { name: "尼", usfm: "NEH" },
  { name: "伯", usfm: "JOB" },
  { name: "詩", usfm: "PSA" },
  { name: "箴", usfm: "PRO" },
  { name: "傳", usfm: "ECC" },
  { name: "歌", usfm: "SNG" },
  { name: "賽", usfm: "ISA" },
  { name: "耶", usfm: "JER" },
  { name: "哀", usfm: "LAM" },
  { name: "結", usfm: "EZK" },
  { name: "但", usfm: "DAN" },
  { name: "何", usfm: "HOS" },
  { name: "珥", usfm: "JOL" },
  { name: "摩", usfm: "AMO" },
  { name: "俄", usfm: "OBA" },
  { name: "拿", usfm: "JON" },
  { name: "彌", usfm: "MIC" },
  { name: "鴻", usfm: "NAM" },
  { name: "哈", usfm: "HAB" },
  { name: "番", usfm: "ZEP" },
  { name: "該", usfm: "HAG" },
  { name: "亞", usfm: "ZEC" },
  { name: "瑪", usfm: "MAL" },
  { name: "太", usfm: "MAT" },
  { name: "可", usfm: "MRK" },
  { name: "路", usfm: "LUK" },
  { name: "約", usfm: "JHN" },
  { name: "徒", usfm: "ACT" },
  { name: "羅", usfm: "ROM" },
  { name: "加", usfm: "GAL" },
  { name: "弗", usfm: "EPH" },
  { name: "腓", usfm: "PHP" },
  { name: "西", usfm: "COL" },
  { name: "來", usfm: "HEB" },
  { name: "雅", usfm: "JAS" },
  { name: "猶", usfm: "JUD" },
  { name: "啓", usfm: "REV" },
  { name: "詩篇", usfm: "PSA" },
].sort((a, b) => b.name.length - a.name.length);

const FULL_BOOK_NAME_PATTERN = /(?:記|書|福音|詩篇)$/;

function allowsBareChapterReference(bookName: string): boolean {
  return bookName.length >= 3 || FULL_BOOK_NAME_PATTERN.test(bookName);
}

const BOOK_NAME_PATTERN = BIBLE_BOOKS.map((book) =>
  book.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");

const BIBLE_REFERENCE_PATTERN = new RegExp(
  `(${BOOK_NAME_PATTERN})\\s*(?:` +
    `(?<chapter1>\\d+)\\s*[:：]\\s*(?<verseStart>\\d+)\\s*-\\s*(?<chapter2>\\d+)\\s*[:：]\\s*(?<verseEnd>\\d+)` +
    `|` +
    `(?<chapter3>\\d+)\\s*[:：]\\s*(?<verses>\\d+(?:\\s*-\\s*\\d+)?(?:\\s*,\\s*\\d+)*)` +
    `|` +
    `(?:第\\s*)?(?<chapter6>\\d+)\\s*章` +
    `|` +
    `(?:第\\s*)?(?<chapter7>\\d+)\\s*-\\s*(?<chapter8>\\d+)\\s*章` +
    `|` +
    `(?:第\\s*)?(?<chapter4>\\d+)\\s*-\\s*(?<chapter5>\\d+)` +
    `|` +
    `(?:第\\s*)?(?<chapter10>\\d+(?:、\\d+)+)` +
    `|` +
    `(?:第\\s*)?(?<chapter9>\\d+)(?![\\d:：章、-])` +
    `)`,
  "g",
);

function normalizeVerseRange(chapter: string, verses: string): string {
  const chapterNumber = Number(chapter);
  const parts = verses.split(/\s*,\s*/).map((part) => part.trim());

  if (parts.length === 1) {
    return `${chapterNumber}.${parts[0].replace(/\s*-\s*/g, "-")}`;
  }

  const verseNumbers = parts.flatMap((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      return [start, end];
    }

    return [Number(part)];
  });

  const minVerse = Math.min(...verseNumbers);
  const maxVerse = Math.max(...verseNumbers);
  return `${chapterNumber}.${minVerse}-${maxVerse}`;
}

function buildUsfmReference(bookUsfm: string, groups: RegExpMatchArray["groups"]): string | null {
  if (!groups) {
    return null;
  }

  if (groups.chapter1 && groups.verseStart && groups.chapter2 && groups.verseEnd) {
    return `${bookUsfm}.${groups.chapter1}.${groups.verseStart}-${groups.chapter2}.${groups.verseEnd}`;
  }

  if (groups.chapter3 && groups.verses) {
    return `${bookUsfm}.${normalizeVerseRange(groups.chapter3, groups.verses)}`;
  }

  if (groups.chapter6) {
    return `${bookUsfm}.${groups.chapter6}`;
  }

  if (groups.chapter7 && groups.chapter8) {
    return `${bookUsfm}.${groups.chapter7}`;
  }

  if (groups.chapter4 && groups.chapter5) {
    return `${bookUsfm}.${groups.chapter4}`;
  }

  if (groups.chapter10) {
    return `${bookUsfm}.${groups.chapter10.split("、")[0]}`;
  }

  if (groups.chapter9) {
    return `${bookUsfm}.${groups.chapter9}`;
  }

  return null;
}

export function buildYouVersionBibleUrl(usfm: string): string {
  const { versionId, abbreviation } = YOUVERSION_RCUV;
  return `https://www.bible.com/bible/${versionId}/${usfm}.${abbreviation}`;
}

export function findBibleReferenceLinks(text: string): Array<{ start: number; end: number; href: string }> {
  const links: Array<{ start: number; end: number; href: string }> = [];

  for (const match of text.matchAll(BIBLE_REFERENCE_PATTERN)) {
    const bookName = match[1];
    const book = BIBLE_BOOKS.find((item) => item.name === bookName);
    if (!book) {
      continue;
    }

    const usfm = buildUsfmReference(book.usfm, match.groups);
    if (!usfm) {
      continue;
    }

    if (match.groups?.chapter9 && !allowsBareChapterReference(bookName)) {
      continue;
    }

    if (match.groups?.chapter10 && !allowsBareChapterReference(bookName)) {
      continue;
    }

    const start = match.index ?? 0;
    links.push({
      start,
      end: start + match[0].length,
      href: buildYouVersionBibleUrl(usfm),
    });
  }

  return links;
}
