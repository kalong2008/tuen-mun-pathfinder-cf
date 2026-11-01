import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { safeReturnPath } from "../auth-redirect";

export async function assertSignedIn(returnPath: string) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    throw redirect({
      to: "/sign-in",
      search: { redirect: safeReturnPath(returnPath) },
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
    await requireSignedInRequest({ data: returnPath });
  });
