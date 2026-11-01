import type { ReactNode } from "react";
import { SignIn } from "@clerk/tanstack-react-start";
import { Shell } from "./shell";

export function AuthScreen({ children }: { children: ReactNode }) {
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
      signUpUrl="/"
      appearance={{
        elements: {
          footerAction: { display: "none" },
        },
      }}
    />
  );
}
