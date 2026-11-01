import { useRef } from "react";
import { SignInButton, SignOutButton, useAuth } from "@clerk/tanstack-react-start";

type AuthSlot = "pending" | "signed-in" | "signed-out";

function authSlot(isLoaded: boolean, isSignedIn: boolean | undefined, known: boolean | null): AuthSlot {
  if (isLoaded) return isSignedIn ? "signed-in" : "signed-out";
  if (known === true) return "signed-in";
  if (known === false) return "signed-out";
  return "pending";
}

export function AuthButtons() {
  const { isLoaded, isSignedIn } = useAuth();
  const known = useRef<boolean | null>(null);
  const slot = authSlot(isLoaded, isSignedIn, known.current);
  if (isLoaded) known.current = Boolean(isSignedIn);

  return (
    <div className="auth-buttons">
      <AuthSlotButton slot={slot} />
    </div>
  );
}

function AuthSlotButton({ slot }: { slot: AuthSlot }) {
  switch (slot) {
    case "signed-in":
      return (
        <SignOutButton>
          <button type="button" className="auth-out">登出</button>
        </SignOutButton>
      );
    case "signed-out":
      return (
        <SignInButton mode="modal">
          <button type="button" className="auth-in">登入</button>
        </SignInButton>
      );
    case "pending":
      return (
        <button type="button" className="auth-in is-reserved" tabIndex={-1} aria-hidden="true">
          登入
        </button>
      );
    default: {
      const unreachable: never = slot;
      return unreachable;
    }
  }
}
