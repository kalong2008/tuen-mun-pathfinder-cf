import { useEffect, type MouseEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth, useClerk } from "@clerk/tanstack-react-start";

const PENDING_ALBUM = "album-after-login";

export function isProtectedAlbum(href: string) {
  return href.replace(/^\//, "").startsWith("20");
}

export function rememberAlbum(href: string) {
  const path = href.startsWith("/") ? href : `/${href}`;
  try {
    sessionStorage.setItem(PENDING_ALBUM, path);
  } catch {
    // Storage can be unavailable. The album page still opens its own login popup.
  }
}

export function ProtectedVisit() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(PENDING_ALBUM);
      if (target) sessionStorage.removeItem(PENDING_ALBUM);
    } catch {
      return;
    }
    if (!target || window.location.pathname === target) return;
    window.location.assign(target);
  }, [isLoaded, isSignedIn]);

  return null;
}

export function AlbumLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const slug = href.replace(/^\//, "");

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    if (!isProtectedAlbum(href) || !isLoaded || isSignedIn) return;
    event.preventDefault();
    rememberAlbum(href);
    openSignIn();
  }

  return (
    <Link to="/$slug" params={{ slug }} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
