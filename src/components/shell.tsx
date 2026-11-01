import { useEffect, useRef, useState, type ReactNode } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { AuthButtons } from "./auth-buttons";

const rootRoute = getRouteApi("__root__");

const KNOWN_PAGES = {
  "/adventurer-honors": "/adventurer-honors",
  "/notice": "/notice",
  "/videos": "/videos",
  "/contact": "/contact",
} as const;

export function Shell({ children }: { children: ReactNode }) {
  const { links, sections } = rootRoute.useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const closeTimers = useRef(new Map<string, number>());

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setHidden(!reduce && !menuOpen && y > last && y > 50);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  const years = new Map<string, typeof links>();
  for (const link of links) {
    if (link.yearGroup === "other") continue;
    const current = years.get(link.yearGroup) ?? [];
    current.push(link);
    years.set(link.yearGroup, current);
  }
  const other = links.filter((link) => link.yearGroup === "other" && link.href in KNOWN_PAGES);

  return (
    <div className="site">
      <a className="skip" href="#content">跳到內容</a>
      <header className={hidden ? "bar is-hidden" : "bar"}>
        <div className="bar-inner">
          <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
            <img src="/pathfinder-adventurer.png" alt="" width={120} height={32} />
            <span className="sr">屯門前鋒會</span>
          </Link>
          <div className="bar-end">
            <AuthButtons />
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr">{menuOpen ? "關閉選單" : "開啟選單"}</span>
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
          <nav id="site-nav" className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="主要">
            {sections.map((section) => {
              const columns = section.years
                .map((year) => ({
                  year,
                  links: years.get(String(year)) ?? [],
                }))
                .filter((column) => column.links.length > 0);
              if (columns.length === 0) return null;
              return (
                <details
                  key={section.id}
                  className="year-menu"
                  onMouseEnter={(event) => holdYearMenu(section.id, event.currentTarget, closeTimers.current)}
                  onMouseLeave={(event) => releaseYearMenu(section.id, event.currentTarget, closeTimers.current)}
                >
                  <summary>
                    {section.label}
                    <Chevron />
                  </summary>
                  <div className={columns.length > 1 ? "year-panel is-wide" : "year-panel"}>
                    {columns.map((column) => (
                      <div key={column.year}>
                        {columns.length > 1 ? <p className="year-label">{column.year}年</p> : null}
                        {column.links.map((link) => (
                          <Link
                            key={link.id}
                            to="/$slug"
                            params={{ slug: link.href.replace(/^\//, "") }}
                            className="year-link"
                            onClick={() => setMenuOpen(false)}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
            {other.map((link) => (
              <Link
                key={link.id}
                to={KNOWN_PAGES[link.href as keyof typeof KNOWN_PAGES]}
                className="nav-text"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {links.some((link) => link.href === "/contact") ? null : (
              <Link to="/contact" className="nav-text" onClick={() => setMenuOpen(false)}>
                聯絡我們
              </Link>
            )}
            <div className="auth-desktop">
              <AuthButtons />
            </div>
          </nav>
        </div>
      </header>
      <main id="content">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <Link to="/" className="footer-brand">
            <img src="/pathfinder-adventurer.png" alt="" width={90} height={24} />
            <span>屯門前鋒會 幼鋒會 | 基督復臨安息日會屯門教會</span>
          </Link>
          <div className="social">
            <a href="https://www.instagram.com/tuenmunpathfinder/" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://www.youtube.com/channel/UCpbnT5M0a7rdYhDUIGA37LQ" aria-label="YouTube">
              <YouTubeIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function holdYearMenu(id: string, menu: HTMLDetailsElement, timers: Map<string, number>) {
  if (!window.matchMedia("(min-width: 1024px)").matches) return;
  const pending = timers.get(id);
  if (pending !== undefined) window.clearTimeout(pending);
  menu.open = true;
}

function releaseYearMenu(id: string, menu: HTMLDetailsElement, timers: Map<string, number>) {
  if (!window.matchMedia("(min-width: 1024px)").matches) return;
  const pending = timers.get(id);
  if (pending !== undefined) window.clearTimeout(pending);
  timers.set(id, window.setTimeout(() => {
    menu.open = false;
    timers.delete(id);
  }, 120));
}

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="chevron">
      <path fill="currentColor" d="M5.2 7.4a1 1 0 0 1 1.4 0L10 10.8l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.8a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path fill="currentColor" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.4 7.1a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C18.9 5 12 5 12 5s-6.9 0-8.5.5a3 3 0 0 0-2.1 2.1C1 9 1 12.2 1 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C5.1 19.4 12 19.4 12 19.4s6.9 0 8.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6ZM9.8 15.5v-6.6l6.2 3.3Z" />
    </svg>
  );
}
