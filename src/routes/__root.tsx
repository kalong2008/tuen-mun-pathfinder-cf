import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { hyperlinks, photoSections } from "@schema";
import { asc, db } from "void/db";
import appCss from "../styles.css?url";

const getNav = createServerFn({ method: "GET" }).handler(async () => {
  const [links, sections] = await Promise.all([
    db.select().from(hyperlinks).orderBy(asc(hyperlinks.sortOrder)),
    db.select().from(photoSections).orderBy(asc(photoSections.sortOrder)),
  ]);
  return { links, sections };
});

export const Route = createRootRoute({
  loader: () => getNav(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "屯門前鋒會 幼鋒會" },
      { name: "theme-color", content: "#FFFFFF" },
      {
        name: "description",
        content: "屯門前鋒會及幼鋒會（6-15歲）。信仰為本的全人發展培訓，透過歷奇、服務與技能學習成長。",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+HK:wght@400;500;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
          {children}
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}
