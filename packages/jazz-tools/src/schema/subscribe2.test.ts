import { beforeEach, describe, expect, it } from "vitest";
import { co } from "../exports.js";
import { createJazzTestAccount } from "../testing.js";
import { CoMapInstance, CoMapSchema } from "./coMap.js";
import { loadCoValue, subscribeToCoValue } from "./subscribe.js";

beforeEach(async () => {
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("CoMap load", () => {
  it("should load a CoMap without nested values", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = (await loadCoValue(MyCoMap, myCoMap.$id, {
      resolve: true,
    })) as CoMapInstance<MyCoMap> & {
      name: string;
      age: number;
      ref: CoMapInstance<MyCoMap> & { name: string; age: number };
    };

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref).toBe(null);
  });

  it("should $resolve nested values", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = (await loadCoValue(MyCoMap, myCoMap.$id, {
      resolve: true,
    })) as CoMapInstance<MyCoMap> & {
      name: string;
      age: number;
      ref: CoMapInstance<MyCoMap> & { name: string; age: number };
    };

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref).toBe(null);

    const loaded2 = await loaded.$resolve({
      resolve: { ref: true } as any,
    });

    expect(loaded2.ref?.name).toBe("Jane");
    expect(loaded2.ref?.age).toBe(20);
  });

  it("should load a CoMap with nested values", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = (await loadCoValue(MyCoMap, myCoMap.$id, {
      resolve: {
        ref: true,
      } as any,
    })) as CoMapInstance<MyCoMap> & {
      name: string;
      age: number;
      ref: CoMapInstance<MyCoMap> & { name: string; age: number };
    };

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref?.name).toBe("Jane");
    expect(loaded.ref?.age).toBe(20);
  });

  it("should handle immutable updates", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = (await loadCoValue(MyCoMap, myCoMap.$id, {
      resolve: {
        ref: true,
      } as any,
    })) as CoMapInstance<MyCoMap> & {
      name: string;
      age: number;
      ref: CoMapInstance<MyCoMap> & { name: string; age: number };
    };

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref.name).toBe("Jane");
    expect(loaded.ref.age).toBe(20);

    loaded.ref.$set("name", "John");

    expect(loaded.ref.name).toBe("Jane");
    expect(loaded.ref.$updated().name).toBe("John");
  });
});

describe("CoMap subscribe", () => {
  it("should syncronously load a CoMap without nested values", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$id,
      {
        resolve: true,
      },
      (value) => {
        result = value;
      },
    );

    expect(result.name).toBe("John");
    expect(result.age).toBe(30);
    expect(result.ref).toBe(null);
  });

  it("should syncronously load a CoMap with nested values", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$id,
      {
        resolve: {
          ref: true,
        } as any,
      },
      (value) => {
        result = value;
      },
    );

    expect(result.name).toBe("John");
    expect(result.age).toBe(30);
    expect(result.ref?.name).toBe("Jane");
    expect(result.ref?.age).toBe(20);
  });

  it("should handle immutable updates", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$id,
      {
        resolve: {
          ref: true,
        } as any,
      },
      (value) => {
        result = value;
      },
    );

    expect(result.name).toBe("John");
    expect(result.age).toBe(30);
    expect(result.ref?.name).toBe("Jane");
    expect(result.ref?.age).toBe(20);

    const resultBeforeSet = result;

    result.ref.$set("name", "John");

    expect(result.ref.name).toBe("John");
    expect(resultBeforeSet.ref.name).toBe("Jane");
  });

  it("should update only the changed path", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
      ref2 = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({ name: "Jane", age: 20 }),
      ref2: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$id,
      {
        resolve: {
          ref: true,
          ref2: true,
        } as any,
      },
      (value) => {
        result = value;
      },
    );

    expect(result.ref2?.name).toBe("Jane");
    expect(result.ref2?.age).toBe(20);

    const resultBeforeSet = result;

    result.ref.$set("name", "John");

    expect(result.ref.name).toBe("John");
    expect(resultBeforeSet.ref.name).toBe("Jane");
    expect(result.ref2).toBe(resultBeforeSet.ref2);
  });

  it("should support $request", async () => {
    class MyCoMap extends CoMapSchema {
      name = co.string;
      age = co.number;
      ref = co.optional.ref(MyCoMap);
      ref2 = co.optional.ref(MyCoMap);
    }

    // @ts-expect-error
    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: MyCoMap.create({
        name: "Jane",
        age: 20,
        ref: MyCoMap.create({ name: "Jane Child", age: 20 }),
      }),
      ref2: MyCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$id,
      {
        resolve: {
          ref: true,
        } as any,
      },
      (value) => {
        result = value;
      },
    );

    const jane = result.ref;

    expect(jane?.name).toBe("Jane");
    expect(jane?.age).toBe(20);
    expect(jane?.ref).toBe(null);

    // To do autoloading inside components
    jane?.$request({ resolve: { ref: true } });

    const janeAfterRequest = result.ref;

    expect(janeAfterRequest?.ref?.name).toBe("Jane Child");
  });
});
