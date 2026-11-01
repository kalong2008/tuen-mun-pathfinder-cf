import { useEffect, type MouseEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth, useClerk } from "@clerk/tanstack-react-start";

let pendingPath: string | null = null;

export function isProtectedAlbum(href: string) {
  return href.replace(/^\//, "").startsWith("20");
}

export function ProtectedVisit() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !pendingPath) return;
    const target = pendingPath;
    pendingPath = null;
    if (window.location.pathname === target) {
      window.location.reload();
      return;
    }
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
    pendingPath = href.startsWith("/") ? href : `/${slug}`;
    openSignIn();
  }

  return (
    <Link to="/$slug" params={{ slug }} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
