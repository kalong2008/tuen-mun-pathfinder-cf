/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly CANVA_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
