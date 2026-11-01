import codes from "./docx-codes.json";

export function getAvailableDocxCodes(): Set<string> {
  return new Set(codes);
}
