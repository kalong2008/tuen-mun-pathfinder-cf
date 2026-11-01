import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { voidPlugin } from "void";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  ssr: {
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/server",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
  },
  plugins: [
    voidPlugin(),
    tanstackStart(),
    react(),
    tailwindcss(),
  ],
});
