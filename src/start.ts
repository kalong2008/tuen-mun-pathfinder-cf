import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    clerkMiddleware({
      signInUrl: "/sign-in",
      signUpUrl: "/",
    }),
  ],
}));
