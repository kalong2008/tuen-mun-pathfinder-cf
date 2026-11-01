import { normalizeChineseQuotes } from "./answer-format";

export type RequirementListStyle = "decimal" | "lower-alpha" | "lower-roman" | "disc";

export interface RequirementNode {
  text: string;
  children: RequirementNode[];
  childListStyle: RequirementListStyle | null;
}

const LEADING_REQUIREMENT_NUMBER = /^\d+\.\s*/;
const LEADING_BULLET = /^◼\s*/;
const LEADING_LETTER = /^([a-z])\.\s*/i;
const LEADING_ROMAN = /^(i{1,3}|iv|vi{0,3}|ix|x)\.\s*/i;

const ROMAN_VALUES: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
};

export function formatRequirementForDisplay(requirement: string): string {
  return normalizeChineseQuotes(requirement.replace(LEADING_REQUIREMENT_NUMBER, ""));
}

function stripNumericPrefix(requirement: string): string | null {
  const match = requirement.match(/^(\d+)\.\s*/);
  if (!match) {
    return null;
  }

  return requirement.slice(match[0].length);
}

function stripBulletPrefix(requirement: string): string | null {
  const match = requirement.match(LEADING_BULLET);
  if (!match) {
    return null;
  }

  return requirement.slice(match[0].length);
}

function stripLetterPrefix(requirement: string): { letter: string; text: string } | null {
  const match = requirement.match(LEADING_LETTER);
  if (!match) {
    return null;
  }

  return {
    letter: match[1].toLowerCase(),
    text: requirement.slice(match[0].length),
  };
}

function stripRomanPrefix(requirement: string): { roman: string; text: string } | null {
  const match = requirement.match(LEADING_ROMAN);
  if (!match) {
    return null;
  }

  return {
    roman: match[1].toLowerCase(),
    text: requirement.slice(match[0].length),
  };
}

function createNode(text: string): RequirementNode {
  return {
    text,
    children: [],
    childListStyle: null,
  };
}

function nextLetter(letter: string): string {
  return String.fromCharCode(letter.charCodeAt(0) + 1);
}

function shouldTreatAsRomanSubItem(lastLetter: string | null, roman: string): boolean {
  if (!lastLetter || !(roman in ROMAN_VALUES)) {
    return false;
  }

  if (roman !== "i") {
    return true;
  }

  return nextLetter(lastLetter) !== "i";
}

function appendChild(
  parent: RequirementNode,
  child: RequirementNode,
  listStyle: RequirementListStyle,
): void {
  parent.children.push(child);

  if (parent.childListStyle === null) {
    parent.childListStyle = listStyle;
  }
}

export function buildRequirementTree(requirements: string[]): RequirementNode[] {
  const root: RequirementNode[] = [];
  let currentTop: RequirementNode | null = null;
  let currentSub: RequirementNode | null = null;
  let lastLetter: string | null = null;

  for (const requirement of requirements) {
    const numericText = stripNumericPrefix(requirement);
    if (numericText !== null) {
      const node = createNode(numericText);
      root.push(node);
      currentTop = node;
      currentSub = null;
      lastLetter = null;
      continue;
    }

    const bulletText = stripBulletPrefix(requirement);
    if (bulletText !== null) {
      const node = createNode(bulletText);
      const parent = currentSub ?? currentTop;
      if (parent) {
        appendChild(parent, node, "disc");
      } else {
        root.push(node);
      }
      continue;
    }

    const romanMatch = stripRomanPrefix(requirement);
    if (romanMatch && currentSub && shouldTreatAsRomanSubItem(lastLetter, romanMatch.roman)) {
      appendChild(currentSub, createNode(romanMatch.text), "lower-roman");
      continue;
    }

    const letterMatch = stripLetterPrefix(requirement);
    if (letterMatch && currentTop) {
      const node = createNode(letterMatch.text);
      appendChild(currentTop, node, "lower-alpha");
      currentSub = node;
      lastLetter = letterMatch.letter;
      continue;
    }

    root.push(createNode(requirement));
    currentTop = null;
    currentSub = null;
    lastLetter = null;
  }

  return root;
}

export function getRequirementListClassName(style: RequirementListStyle, nested: boolean): string {
  const styleClass: Record<RequirementListStyle, string> = {
    decimal: "list-decimal",
    "lower-alpha": "list-[lower-alpha]",
    "lower-roman": "list-[lower-roman]",
    disc: "list-disc",
  };

  return [
    styleClass[style],
    "list-outside space-y-2 text-gray-700",
    nested ? "mt-2 ml-5 pl-5" : "ml-5 pl-5",
  ].join(" ");
}
