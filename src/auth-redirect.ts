export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.split("?")[0] ?? value;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://") || path.includes("\\")) {
    return "/";
  }
  if (path === "/sign-in" || path.startsWith("/sign-in/") || path === "/sign-up" || path.startsWith("/sign-up/")) {
    return "/";
  }
  return path;
}

export function authReturnSearch(search: Record<string, unknown>) {
  return {
    redirect_url: safeReturnPath(search.redirect_url ?? search.redirect),
  };
}
