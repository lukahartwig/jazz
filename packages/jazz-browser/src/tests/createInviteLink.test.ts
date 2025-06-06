import { CoMap, co, coField, z } from "jazz-tools";
import { expect, test } from "vitest";
import { createInviteLink } from "../index.js";
import { setupTwoNodes } from "./utils.js";

test("throws an error if the user tried to create an invite from an account owned coValue", async () => {
  const TestMap = co.map({
    name: z.string(),
  });

  const { clientAccount } = await setupTwoNodes();

  const map = TestMap.create({ name: "Alice" }, { owner: clientAccount });

  expect(() =>
    createInviteLink(map, "admin", { baseURL: "http://localhost:3000" }),
  ).toThrow("Can't create invite link for object without group");
});
