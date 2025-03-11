import { beforeEach, describe, expect, it } from "vitest";
import { createJazzTestAccount } from "../testing.js";
import { co, z } from "./schema.js";

beforeEach(async () => {
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("CoMap2", () => {
  it("should create a CoMap with basic property access", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30 });

    expect(myCoMap.name).toBe("John");
    expect(myCoMap.age).toBe(30);
  });

  it("should create a CoMap with nested values", () => {
    const NestedCoMap2 = co.map({
      name: z.string(),
      age2: z.number(),
    });

    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap2,
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: NestedCoMap.create({
        name: "Jane",
        age: 20,
        ref: NestedCoMap2.create({ name: "Jane", age2: 20 }),
      }),
    });

    const myCoMap2 = MyCoMap.create({
      name: "John",
      age: 30,
      ref: { name: "Jane", age: 20, ref: { name: "Jane", age2: 20 } },
    });

    expect(myCoMap.name).toBe("John");
    expect(myCoMap.age).toBe(30);
    expect(myCoMap2.ref?.ref?.name).toBe("Jane");
    expect(myCoMap.ref?.age).toBe(20);
    expect(myCoMap.ref?.ref.name).toBe("Jane");
  });

  // it("should create a CoMap with self references", () => {
  //   const MyCoMap = co.map({
  //     name: z.string(),
  //     age: z.number(),
  //     ref: co.self(),
  //   });

  //   const myCoMap = MyCoMap.create({
  //     name: "John",
  //     age: 30,
  //     ref: {
  //       name: "Jane",
  //       age: 20,
  //       ref: { name: "Jane", age: 20 },
  //     },
  //   });

  //   expect(myCoMap.name).toBe("John");
  //   expect(myCoMap.age).toBe(30);
  //   expect(myCoMap.ref?.age).toBe(20);
  //   expect(myCoMap.ref?.ref.name).toBe("Jane");
  // });

  it("should not change original property after calling $set", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30 });
    myCoMap.$jazz.set("age", 31);

    expect(myCoMap.age).toBe(30);
    expect(Object.entries(myCoMap)).toEqual([
      ["name", "John"],
      ["age", 30],
    ]);
  });

  it("should properly serialize to JSON", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30 });

    expect(JSON.stringify(myCoMap)).toMatchInlineSnapshot(
      `"{"name":"John","age":30}"`,
    );
  });

  it("should properly serialize nedted values to JSON", () => {
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

    expect(JSON.stringify(myCoMap)).toMatchInlineSnapshot(
      `"{"name":"John","age":30,"ref":{"name":"Jane","age":20}}"`,
    );
  });

  it("should return updated values after calling $set and $updated", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30 });
    myCoMap.$jazz.set("age", 31);

    const updated = myCoMap.$jazz.updated();

    expect(updated.age).toBe(31);
    expect(Object.entries(updated)).toEqual([
      ["name", "John"],
      ["age", 31],
    ]);
  });

  it("should return support $set with relations", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: NestedCoMap,
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30 });
    myCoMap.$jazz.set("ref", NestedCoMap.create({ name: "Jane", age: 20 }));

    const updated = await myCoMap.$jazz.resolve({
      resolve: {
        ref: true,
      },
    });

    expect(updated.ref).toEqual({
      name: "Jane",
      age: 20,
    });
  });

  it("should return the same instance on $updated if there are no changes", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30 });

    expect(myCoMap.$jazz.updated()).toBe(myCoMap);
  });
});
