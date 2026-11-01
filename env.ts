import { defineEnv, string } from "void/env";

export default defineEnv({
  NOCOLY_APP_KEY: string(),
  NOCOLY_SIGN: string(),
});
