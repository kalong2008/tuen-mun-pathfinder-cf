import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SignUpForm } from "../components/auth-screen";

const signUpRoute = getRouteApi("/sign-up");

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpStepPage,
});

function SignUpStepPage() {
  const { redirect_url: returnPath } = signUpRoute.useSearch();
  return <SignUpForm returnPath={returnPath} />;
}
