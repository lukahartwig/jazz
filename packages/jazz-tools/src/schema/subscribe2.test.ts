import { assert, beforeEach, describe, expect, it } from "vitest";
import { createJazzTestAccount } from "../testing.js";
import { co, z } from "./schema.js";
import { loadCoValue, subscribeToCoValue } from "./subscribe.js";

beforeEach(async () => {
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("CoMap load", () => {
  it("should load a CoMap without nested values", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = await loadCoValue(MyCoMap, myCoMap.$jazz.id, {
      resolve: true,
    });

    assert(loaded);

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref).toBe(null);
  });

  it("should $resolve nested values", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = await loadCoValue(MyCoMap, myCoMap.$jazz.id, {
      resolve: true,
    });

    assert(loaded);

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref).toBe(null);

    const loaded2 = await loaded.$jazz.resolve({
      resolve: { ref: true },
    });

    assert(loaded2);

    expect(loaded2.ref.name).toBe("Jane");
    expect(loaded2.ref.age).toBe(20);
  });

  it("should load a CoMap with nested values", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = await loadCoValue(MyCoMap, myCoMap.$jazz.id, {
      resolve: {
        ref: true,
      },
    });

    assert(loaded);

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref?.name).toBe("Jane");
    expect(loaded.ref?.age).toBe(20);
  });

  it("should handle immutable updates", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    const loaded = await loadCoValue(MyCoMap, myCoMap.$jazz.id, {
      resolve: {
        ref: true,
      },
    });

    assert(loaded);

    expect(loaded.name).toBe("John");
    expect(loaded.age).toBe(30);
    expect(loaded.ref.name).toBe("Jane");
    expect(loaded.ref.age).toBe(20);

    loaded.ref.$jazz.set("name", "John");

    expect(loaded.ref.name).toBe("Jane");
    expect(loaded.ref.$jazz.updated().name).toBe("John");
  });
});

describe("CoMap subscribe", () => {
  it("should syncronously load a CoMap without nested values", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$jazz.id,
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
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$jazz.id,
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
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$jazz.id,
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
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
      ref2: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({ name: "Jane", age: 20 }),
      ref2: NestedCoMap.create({ name: "Jane", age: 20 }),
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$jazz.id,
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
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: co.map({
        name: z.string(),
        age: z.number(),
      }),
      ref2: co.map({
        name: z.string(),
        age: z.number(),
      }),
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: {
        name: "Jane",
        age: 20,
      },
      ref2: { name: "Jane", age: 20 },
    });

    let result: any;

    subscribeToCoValue(
      MyCoMap,
      myCoMap.$jazz.id,
      {
        resolve: {
          ref: true,
        } as any,
      },
      (value) => {
        result = value;
      },
    );

    const john = result;

    expect(john?.name).toBe("John");
    expect(john?.age).toBe(30);
    expect(john?.ref2).toBe(null);

    // To do autoloading inside components
    john.$request({ resolve: { ref2: true } });

    const janeAfterRequest = result.ref;

    expect(janeAfterRequest?.name).toBe("Jane");
  });
});
