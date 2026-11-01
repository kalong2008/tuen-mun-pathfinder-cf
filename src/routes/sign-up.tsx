import { Outlet, createFileRoute } from "@tanstack/react-router";
import { authReturnSearch } from "../auth-redirect";
import { AuthScreen } from "../components/auth-screen";

export const Route = createFileRoute("/sign-up")({
  validateSearch: authReturnSearch,
  component: SignUpLayout,
});

function SignUpLayout() {
  const { redirect_url: returnPath } = Route.useSearch();
  return (
    <AuthScreen returnPath={returnPath}>
      <Outlet />
    </AuthScreen>
  );
}
