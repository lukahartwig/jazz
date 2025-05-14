import { describe, expect, it } from "vitest";
import { run } from "..";

describe(
  "It should run models",
  {
    timeout: 10000,
  },
  () => {
    it("should run a model", async () => {
      const result = await run();
    });
  },
);
