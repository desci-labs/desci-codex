import { defineConfig } from "vitest/config";
import GithubActionsReporter from "vitest-github-actions-reporter";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    reporters: process.env.GITHUB_ACTIONS
      ? ["verbose", new GithubActionsReporter()]
      : "verbose",
  },
});
