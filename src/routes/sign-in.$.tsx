import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SignInForm } from "../components/auth-screen";

const signInRoute = getRouteApi("/sign-in");

export const Route = createFileRoute("/sign-in/$")({
  component: SignInStepPage,
});

function SignInStepPage() {
  const { redirect_url: returnPath } = signInRoute.useSearch();
  return <SignInForm returnPath={returnPath} />;
}
