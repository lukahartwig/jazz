import { render } from "@testing-library/svelte";
import { Account, CoMap, co, type DepthsIn } from "jazz-tools";
import { describe, expect, it } from "vitest";
import { useAccount, type RegisteredAccount } from "../index.js";
import { createJazzTestAccount, createJazzTestContext } from "../testing.js";
import UseAccount from "./components/useAccount.svelte";

function setup(options: {
  account: RegisteredAccount;
  depth?: DepthsIn<RegisteredAccount>;
}) {
  const result = { current: undefined } as { current: ReturnType<typeof useAccount> | undefined };

    render(UseAccount, {
      context: createJazzTestContext({ account: options.account }),
      props: {
        depth: options.depth ?? [],
        setResult: (value) => {
          result.current = value
        },
      },
    });

  return result;
}

declare module "../jazz.svelte.js" {
  interface Register {
    Account: AccountSchema;
  }
}

class AccountRoot extends CoMap {
  value = co.string;
}

class AccountSchema extends Account {
  root = co.ref(AccountRoot);

  migrate() {
    if (!this._refs.root) {
      this.root = AccountRoot.create({ value: "123" }, { owner: this });
    }
  }
}

describe("useAccount", () => {
  it("should return the correct value", async () => {
    const account = await createJazzTestAccount({
      AccountSchema,
    });

    const result = setup({
      account,
    });

      expect(result.current?.me).toEqual(account);
  });

  it("should load nested values if requested", async () => {
    const account = await createJazzTestAccount({
      AccountSchema,
    });

    const result = setup({
      account,
      depth: {
        root: {}
      }
    });

      expect(result.current?.me?.root?.value).toBe("123");
  });
});