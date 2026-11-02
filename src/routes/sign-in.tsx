import { Outlet, createFileRoute } from "@tanstack/react-router";
import { authReturnSearch } from "../auth-redirect";
import { AuthScreen } from "../components/auth-screen";

export const Route = createFileRoute("/sign-in")({
  validateSearch: authReturnSearch,
  head: () => ({
    meta: [{ title: "登入 | 屯門前鋒會 幼鋒會" }],
  }),
  component: SignInLayout,
});

function SignInLayout() {
  return (
    <AuthScreen>
      <Outlet />
    </AuthScreen>
  );
}
