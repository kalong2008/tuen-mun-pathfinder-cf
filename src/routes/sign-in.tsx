import { Outlet, createFileRoute } from "@tanstack/react-router";
import { authReturnSearch } from "../auth-redirect";
import { AuthScreen } from "../components/auth-screen";

export const Route = createFileRoute("/sign-in")({
  validateSearch: authReturnSearch,
  component: SignInLayout,
});

function SignInLayout() {
  return (
    <AuthScreen>
      <Outlet />
    </AuthScreen>
  );
}
