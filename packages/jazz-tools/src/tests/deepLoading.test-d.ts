import { cojsonInternals } from "cojson";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import { assert, describe, expect, expectTypeOf, test, vi } from "vitest";
import {
  Account,
  CoFeed,
  CoList,
  CoMap,
  Group,
  ID,
  Profile,
  SessionID,
  co,
  createJazzContextFromExistingCredentials,
  isControlledAccount,
} from "../index.js";
import { randomSessionProvider } from "../internal.js";
import { createJazzTestAccount, linkAccounts } from "../testing.js";
import { waitFor } from "./utils.js";

const Crypto = await WasmCrypto.create();
const { connectedPeers } = cojsonInternals;

class TestMap extends CoMap {
  list = co.ref(TestList);
  optionalRef = co.ref(InnermostMap, { optional: true });
}

class TestList extends CoList.Of(co.ref(() => InnerMap)) {}

class InnerMap extends CoMap {
  stream = co.ref(TestStream);
}

class TestStream extends CoFeed.Of(co.ref(() => InnermostMap)) {}

class InnermostMap extends CoMap {
  value = co.string;
}

const me = await createJazzTestAccount({});
const map = TestMap.create({
  list: TestList.create([], { owner: me }),
});

describe("Deep loading with depth arg", async () => {
  test("load without resolve", async () => {
    const map1 = await TestMap.load(map.id);

    function validateType(map: TestMap | null) {
      map;
    }

    validateType(map1);
  });

  test("load with resolve { list: true }", async () => {
    const map2 = await TestMap.load(map.id, {
      resolve: { list: true },
    });
    expectTypeOf(map2).toEqualTypeOf<
      | (TestMap & {
          list: TestList;
        })
      | null
    >();
  });

  test("load with resolve { list: { $each: true } }", async () => {
    const map3 = await TestMap.load(map.id, {
      resolve: { list: { $each: true } },
    });
    expectTypeOf(map3).toEqualTypeOf<
      | (TestMap & {
          list: TestList & InnerMap[];
        })
      | null
    >();
  });

  test("load with resolve { optionalRef: true }", async () => {
    const map3a = await TestMap.load(map.id, {
      resolve: { optionalRef: true } as const,
    });
    expectTypeOf(map3a).toEqualTypeOf<
      | (TestMap & {
          optionalRef: InnermostMap | undefined;
        })
      | null
    >();
  });

  test("load with resolve { list: { $each: { stream: true } } }", async () => {
    const map4 = await TestMap.load(map.id, {
      resolve: { list: { $each: { stream: true } } },
    });
    expectTypeOf(map4).toEqualTypeOf<
      | (TestMap & {
          list: TestList & (InnerMap & { stream: TestStream })[];
        })
      | null
    >();
  });

  test("load with resolve { list: { $each: { stream: { $each: true } } } }", async () => {
    const map5 = await TestMap.load(map.id, {
      resolve: { list: { $each: { stream: { $each: true } } } },
    });
    type ExpectedMap5 =
      | (TestMap & {
          list: TestList &
            (InnerMap & {
              stream: TestStream & {
                byMe?: { value: InnermostMap };
                inCurrentSession?: { value: InnermostMap };
                perSession: {
                  [sessionID: SessionID]: {
                    value: InnermostMap;
                  };
                };
              } & {
                [key: ID<Account>]: { value: InnermostMap };
              };
            })[];
        })
      | null;
    expectTypeOf(map5).toEqualTypeOf<ExpectedMap5>();
  });

  test("should handle $skipInvalid on CoList", async () => {
    class List extends CoList.Of(co.ref(() => InnerMap)) {}

    const result = await List.load("x" as ID<List>, {
      resolve: { $each: true, $skipInvalid: true },
    });
    function validateType(map: ((InnerMap | null)[] & List) | null) {
      map;
    }

    validateType(result);
    expectTypeOf(result).toEqualTypeOf<((InnerMap | null)[] & List) | null>();
  });

  test("should handle $skipInvalid on CoMap.Record", async () => {
    class Record extends CoMap.Record(co.ref(() => InnerMap)) {}

    const result = await Record.load("x" as ID<Record>, {
      resolve: { $each: true, $skipInvalid: true },
    });

    type ExpectedResult =
      | ({
          [key: string]: InnerMap | null;
        } & Record)
      | null;

    function validateType(map: ExpectedResult) {
      map;
    }

    validateType(result);
    expectTypeOf(result).toEqualTypeOf<ExpectedResult>();
  });
});

class CustomProfile extends Profile {
  stream = co.ref(TestStream);
}

class CustomAccount extends Account {
  profile = co.ref(CustomProfile);
  root = co.ref(TestMap);

  async migrate(
    this: CustomAccount,
    creationProps?: { name: string } | undefined,
  ) {
    if (creationProps) {
      const profileGroup = Group.create(this);
      this.profile = CustomProfile.create(
        {
          name: creationProps.name,
          stream: TestStream.create([], this),
        },
        profileGroup,
      );
      this.root = TestMap.create({ list: TestList.create([], this) }, this);
    }

    const thisLoaded = await this.ensureLoaded({
      resolve: {
        profile: { stream: true },
        root: { list: true },
      },
    });
    expectTypeOf(thisLoaded).toEqualTypeOf<
      CustomAccount & {
        profile: CustomProfile & {
          stream: TestStream;
        };
        root: TestMap & {
          list: TestList;
        };
      }
    >();
  }
}

test("Deep loading within account", async () => {
  const me = await CustomAccount.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const meLoaded = await me.ensureLoaded({
    resolve: {
      profile: { stream: true },
      root: { list: true },
    },
  });
  expectTypeOf(meLoaded).toEqualTypeOf<
    CustomAccount & {
      profile: CustomProfile & {
        stream: TestStream;
      };
      root: TestMap & {
        list: TestList;
      };
    }
  >();
});

class RecordLike extends CoMap.Record(co.ref(TestMap)) {}

test("Deep loading a record-like coMap", async () => {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const [initialAsPeer, secondPeer] = connectedPeers("initial", "second", {
    peer1role: "server",
    peer2role: "client",
  });

  if (!isControlledAccount(me)) {
    throw "me is not a controlled account";
  }

  me._raw.core.node.syncManager.addPeer(secondPeer);
  const { account: meOnSecondPeer } =
    await createJazzContextFromExistingCredentials({
      credentials: {
        accountID: me.id,
        secret: me._raw.agentSecret,
      },
      sessionProvider: randomSessionProvider,
      peersToLoadFrom: [initialAsPeer],
      crypto: Crypto,
    });

  const record = RecordLike.create(
    {
      key1: TestMap.create(
        { list: TestList.create([], { owner: me }) },
        { owner: me },
      ),
      key2: TestMap.create(
        { list: TestList.create([], { owner: me }) },
        { owner: me },
      ),
    },
    { owner: me },
  );

  const recordLoaded = await RecordLike.load(record.id, {
    loadAs: meOnSecondPeer,
    resolve: {
      $each: { list: { $each: true } },
    },
  });
  expectTypeOf(recordLoaded).toEqualTypeOf<
    | (RecordLike & {
        [key: string]: TestMap & {
          list: TestList & InnerMap[];
        };
      })
    | null
  >();
});

test("The resolve type doesn't accept extra keys", async () => {
  const me = await CustomAccount.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const meLoaded = await me.ensureLoaded({
    resolve: {
      // @ts-expect-error
      profile: { stream: true, extraKey: true },
      // @ts-expect-error
      root: { list: true, extraKey: true },
    },
  });

  expectTypeOf(meLoaded).toEqualTypeOf<
    CustomAccount & {
      profile: CustomProfile & {
        stream: TestStream;
        extraKey: never;
      };
      root: TestMap & {
        list: TestList;
        extraKey: never;
      };
    }
  >();
});
