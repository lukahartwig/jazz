import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { createJazzTestAccount } from "../testing.js";
import { CoMapInit } from "./coMap/schema.js";
import { Loaded, co, z } from "./schema.js";

beforeEach(async () => {
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("CoMap - with zod based schema", () => {
  it("should create a CoMap with basic property access", () => {
    const Person = co.map({
      name: z.string(),
      age: z.number(),
    });

    const john = Person.create({ name: "John", age: 30 });

    expect(john.name).toBe("John");
    expect(john.age).toBe(30);
  });

  it("should generate the right CoMapInit type", () => {
    const Person = co.map({
      name: z.string(),
      age: z.number(),
    });

    expectTypeOf<CoMapInit<typeof Person>>().toEqualTypeOf<{
      name: string;
      age: number;
    }>();
  });

  it("should throw an error if a required field is missing", () => {
    const Person = co.map({
      name: z.string(),
      age: z.number(),
    });

    // @ts-expect-error - age is required
    expect(() => Person.create({ name: "John" })).toThrow(
      /^Field age is required/,
    );
  });

  it("should create a CoMap with nested values", () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age2: z.number(),
    });

    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: co.map({
        name: z.string(),
        age: z.number(),
        ref: NestedCoMap.optional(),
      }),
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      // Maps declared in the schema can be referenced through the shape property
      ref: MyCoMap.shape.ref.create({
        name: "Jane",
        age: 20,
        ref: NestedCoMap.create({ name: "Jane", age2: 20 }),
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

    expectTypeOf(myCoMap.ref?.ref.name).toEqualTypeOf<string>();
  });

  it("should create a CoMap with self references", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: co.self(),
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: {
        name: "Jane",
        age: 20,
        ref: { name: "Jane", age: 20 },
      },
    });

    expect(myCoMap.name).toBe("John");
    expect(myCoMap.age).toBe(30);
    expect(myCoMap.ref?.age).toBe(20);
    expect(myCoMap.ref?.ref.name).toBe("Jane");
  });

  it("should create a CoMap with self references on nested maps", () => {
    const MyCoMap = co.map({
      name: z.string(),
      age: z.number(),
      ref: co.map({
        name: z.string(),
        child: co.optional(co.self()),
      }),
    });

    const myCoMap = MyCoMap.create({
      name: "John",
      age: 30,
      ref: {
        name: "Jane",
        child: { name: "Jane", child: { name: "Jane", child: undefined } },
      },
    });

    expect(myCoMap.name).toBe("John");
    expect(myCoMap.age).toBe(30);
    expect(myCoMap.ref?.child?.child?.name).toBe("Jane");
  });

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
      ref: NestedCoMap.optional(),
    });

    const myCoMap = MyCoMap.create({ name: "John", age: 30, ref: undefined });
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

  it("should support optional values", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.optional(z.string()),
      age: z.number(),
      ref: co.optional(NestedCoMap),
    });

    const myCoMap = MyCoMap.create({
      age: 30,
    });

    expect(myCoMap.name).toBeUndefined();
    expect(myCoMap.age).toBe(30);

    expectTypeOf(myCoMap.name).toEqualTypeOf<string | undefined>();
    expectTypeOf(myCoMap.age).toEqualTypeOf<number>();
    expectTypeOf(myCoMap.ref).toEqualTypeOf<never>();
  });

  it("should check for required references", async () => {
    const NestedCoMap = co.map({
      name: z.string(),
      age: z.number(),
    });

    const MyCoMap = co.map({
      name: z.optional(z.string()),
      age: z.number(),
      ref: NestedCoMap,
    });

    // @ts-expect-error - ref is required
    expect(() => MyCoMap.create({ ref: { name: "Jane", age: 20 } })).toThrow(
      /^Failed to parse field age/,
    );

    // @ts-expect-error - ref is required
    expect(() => MyCoMap.create({ age: 30 })).toThrow(/^Field ref is required/);
  });
});
