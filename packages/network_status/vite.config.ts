import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { analyzer } from "vite-bundle-analyzer";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tsConfigPaths(),
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    ...(process.env.ANALYZE ? [analyzer()] : []),
  ],
  ssr: {
    noExternal: ["@tanstack/react-start", "@tanstack/react-router"],
  },
  optimizeDeps: {
    exclude: ["pg", "dotenv"],
  },
  build: {
    rollupOptions: {
      external: ["pg-native"],
    },
  },
  server: {
    port: 3000,
  },
});
