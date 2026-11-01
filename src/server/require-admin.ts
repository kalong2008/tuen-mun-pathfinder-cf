import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { env } from "void/env";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) return false;

  const user = await clerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY,
  }).users.getUser(userId);
  const role = user.publicMetadata.role;
  return role === "admin";
}
