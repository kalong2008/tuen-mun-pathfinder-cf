import { Show, SignInButton, SignOutButton } from "@clerk/tanstack-react-start";

export function AuthButtons() {
  return (
    <div className="auth-buttons">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="auth-in">登入</button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <SignOutButton>
          <button type="button" className="auth-out">登出</button>
        </SignOutButton>
      </Show>
    </div>
  );
}
