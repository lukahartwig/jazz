import { defineProject } from "vitest/config";
import { customCommands } from "./src/commands";

export default defineProject({
  test: {
    name: "browser-integration-tests",
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [{ browser: "chromium" }],
      commands: customCommands,
    },
    testTimeout: process.env.CI ? 60_000 : 10_000,
  },
});
