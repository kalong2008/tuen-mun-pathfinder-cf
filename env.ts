import { defineEnv, email, string } from "void/env";

export default defineEnv({
  CLERK_SECRET_KEY: string(),
  VITE_CLERK_PUBLISHABLE_KEY: string(),
  NOCOLY_APP_KEY: string(),
  NOCOLY_SIGN: string(),
  RESEND_API_KEY: string(),
  CONTACT_EMAIL_FROM: email(),
  CONTACT_EMAIL_BCC: email(),
});
