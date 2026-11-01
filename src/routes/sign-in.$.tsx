import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { safeReturnPath } from "../auth-redirect";
import { Shell } from "../components/shell";

export const Route = createFileRoute("/sign-in/$")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: safeReturnPath(search.redirect),
  }),
  component: SignInStepPage,
});

function SignInStepPage() {
  const { redirect } = Route.useSearch();
  return (
    <Shell>
      <section className="page auth-page">
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl={redirect}
          signUpUrl="/sign-up"
        />
      </section>
    </Shell>
  );
}
