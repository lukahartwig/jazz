import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "jazz-tools",
    typecheck: {
      include: ["**/*.types.test.ts", "src/schema/coMapWithZod.types.test.ts"],
      checker: "tsc",
    },
  },
});
