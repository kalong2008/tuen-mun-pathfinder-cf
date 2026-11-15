import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultStaleTime: 60_000,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
  });

  return router;
}
