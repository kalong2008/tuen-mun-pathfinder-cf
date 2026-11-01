import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpStepPage,
});

function SignUpStepPage() {
  return null;
}
