import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { safeReturnPath } from "../auth-redirect";
import { Shell } from "../components/shell";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: safeReturnPath(search.redirect),
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { redirect } = Route.useSearch();
  return (
    <Shell>
      <section className="page auth-page">
        <SignUp fallbackRedirectUrl={redirect} signInUrl="/sign-in" />
      </section>
    </Shell>
  );
}
