const DESIGN_ID = /DA[A-Za-z0-9_-]{8,}/;

export function canvaDesignIdFromText(value: string): string {
  return value.match(DESIGN_ID)?.[0] ?? "";
}
