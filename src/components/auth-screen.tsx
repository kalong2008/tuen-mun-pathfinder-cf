import { useEffect, useState, type ReactNode } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/tanstack-react-start";
import { Shell } from "./shell";

const RETURN_RETRY_MS = 5000;

export function AuthScreen({ returnPath, children }: { returnPath: string; children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = Boolean(isLoaded && isSignedIn);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    const key = `auth-return:${returnPath}`;
    try {
      const previous = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - previous < RETURN_RETRY_MS) {
        setHeld(true);
        return;
      }
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // Storage can be unavailable. Still leave the sign-in page once.
    }
    window.location.replace(returnPath);
  }, [returnPath, signedIn]);

  if (signedIn && held) {
    return (
      <Shell>
        <section className="page auth-page">
          <a href={returnPath}>返回</a>
        </section>
      </Shell>
    );
  }
  if (signedIn) return null;
  return (
    <Shell>
      <section className="page auth-page">{children}</section>
    </Shell>
  );
}

export function SignInForm({ returnPath }: { returnPath: string }) {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      forceRedirectUrl={returnPath}
      fallbackRedirectUrl={returnPath}
      signUpUrl="/sign-up"
    />
  );
}

export function SignUpForm({ returnPath }: { returnPath: string }) {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      forceRedirectUrl={returnPath}
      fallbackRedirectUrl={returnPath}
      signInUrl="/sign-in"
    />
  );
}
