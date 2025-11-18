import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { analyzer } from "vite-bundle-analyzer";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";

// Get the current git commit hash
function getGitCommitHash() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn("Could not get git commit hash:", error);
    return "unknown";
  }
}

export default defineConfig({
  plugins: [
    tanstackStart(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tsConfigPaths(),
    tailwindcss(),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    ...(process.env.ANALYZE ? [analyzer()] : []),
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  ssr: {
    noExternal: ["@tanstack/react-start", "@tanstack/react-router"],
  },
  optimizeDeps: {
    exclude: ["pg"],
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
