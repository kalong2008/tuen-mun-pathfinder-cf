const HONOR_CODE_PATTERN = /^(HKA|YOU)\d{4}$/;

export function resolveHonorCode(code: string, aliases: string[] = []): string | undefined {
  const normalizedCode = code.toUpperCase();
  if (HONOR_CODE_PATTERN.test(normalizedCode)) {
    return normalizedCode;
  }

  for (const alias of aliases) {
    const normalizedAlias = alias.toUpperCase();
    if (HONOR_CODE_PATTERN.test(normalizedAlias)) {
      return normalizedAlias;
    }
  }

  return undefined;
}
