import { useEffect, type ReactNode } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/tanstack-react-start";
import { useRouter } from "@tanstack/react-router";
import { Shell } from "./shell";

export function AuthScreen({ returnPath, children }: { returnPath: string; children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const signedIn = isLoaded && isSignedIn;

  useEffect(() => {
    if (!signedIn) return;
    void router.navigate({ href: returnPath, replace: true });
  }, [returnPath, router, signedIn]);

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
