import { defineProject } from "vitest/config";
import { customCommands } from "./src/commands";

export default defineProject({
  test: {
    name: "browser-integration-tests",
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium", headless: true }],
      commands: customCommands,
    },
    testTimeout: process.env.CI ? 60_000 : 10_000,
  },
});
