import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { safeReturnPath } from "../auth-redirect";

type BrowserClerk = {
  loaded?: boolean;
  user?: unknown;
};

export async function assertSignedIn(returnPath: string) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    throw redirect({
      to: "/sign-in",
      search: { redirect_url: safeReturnPath(returnPath) },
    });
  }
}

const requireSignedInRequest = createServerFn({ method: "GET" })
  .validator((returnPath: unknown) => safeReturnPath(returnPath))
  .handler(async ({ data: returnPath }) => {
    await assertSignedIn(returnPath);
  });

export const requireSignedIn = createIsomorphicFn()
  .server(async (returnPath: string) => {
    await assertSignedIn(safeReturnPath(returnPath));
  })
  .client(async (returnPath: string) => {
    const clerk = (window as Window & { Clerk?: BrowserClerk }).Clerk;
    if (clerk?.loaded && clerk.user) {
      window.location.replace(returnPath);
      await new Promise<void>(() => {});
      return;
    }
    await requireSignedInRequest({ data: returnPath });
  });
