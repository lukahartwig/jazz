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
  describe("init", () => {
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

      expectTypeOf<CoMapInit<typeof Person>>().toMatchTypeOf<{
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
        /^Failed to parse field age/,
      );
    });

    it("should not throw an error if a optional field is missing", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number().optional(),
      });

      const john = Person.create({ name: "John" });

      expect(john.age).toBeUndefined();
      expect(john.name).toBe("John");
    });

    it("should create a CoMap with nested values", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });

      expect(john.name).toBe("John");
      expect(john.age).toBe(30);
      expect(john.address.street).toBe("123 Main St");
      expect(john.address.$jazz.owner).toBe(john.$jazz.owner);
    });

    it("should retrurn a loaded type when a reference is passed on create", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co
          .map({
            street: z.string(),
          })
          .optional(),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });

      expectTypeOf<typeof john.address>().toMatchTypeOf<
        Loaded<typeof Person.shape.address>
      >();
    });

    it("should be possible to reference a nested map schema to split group creation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: Person.shape.address.create({ street: "123 Main St" }),
      });

      expect(john.name).toBe("John");
      expect(john.age).toBe(30);
      expect(john.address.street).toBe("123 Main St");
      expect(john.address.$jazz.owner).not.toBe(john.$jazz.owner);
    });

    it("should throw an error if a required ref is missing", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      // @ts-expect-error - address is required
      expect(() => Person.create({ name: "John", age: 30 })).toThrow(
        /^Field address is required/,
      );
    });

    it("should not throw an error if a required ref is missing", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co
          .map({
            street: z.string(),
          })
          .optional(),
      });

      const john = Person.create({ name: "John", age: 30 });

      expect(john.address).toBeUndefined();
    });

    it("should create a CoMap with self references", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        friend: {
          name: "Jane",
          age: 20,
          friend: { name: "Bob", age: 20 },
        },
      });

      expect(john.friend.friend.name).toBe("Bob");
      expect(john.friend.name).toBe("Jane");
    });

    it("should return a loaded type when a self reference is passed on create", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        friend: {
          name: "Jane",
          age: 20,
          friend: { name: "Bob", age: 20 },
        },
      });

      expectTypeOf<typeof john.friend.friend.name>().toEqualTypeOf<string>();
      expectTypeOf<typeof john.friend.friend.friend>().toEqualTypeOf<never>();
    });

    it("should not throw an error if a self reference is missing", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      const john = Person.create({
        name: "John",
        age: 30,
      });

      expect(john.friend).toBeUndefined();
    });
  });

  describe("json format", () => {
    it("should properly serialize to JSON", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
      });

      const john = Person.create({ name: "John", age: 30 });

      expect(JSON.stringify(john)).toMatchInlineSnapshot(
        `"{"name":"John","age":30}"`,
      );
    });

    it("should properly serialize nested values to JSON", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });

      expect(JSON.stringify(john)).toMatchInlineSnapshot(
        `"{"name":"John","age":30,"address":{"street":"123 Main St"}}"`,
      );
    });

    it("should work with Object.entries", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
      });

      const john = Person.create({ name: "John", age: 30 });

      expect(Object.entries(john)).toEqual([
        ["name", "John"],
        ["age", 30],
      ]);
    });

    it("should work on equality checks", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });

      expect(john).toEqual({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });
    });
  });

  describe("updates", () => {
    it("should not change original property after calling $jazz.set", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
      });

      const john = Person.create({ name: "John", age: 30 });

      const jane = john.$jazz.set("name", "Jane");

      expect(john.name).toBe("John");
      expect(jane.name).toBe("Jane");
    });

    it("should update nested values", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });

      const johnAfterMoving = john.$jazz.set(
        "address",
        Person.shape.address.create({
          street: "456 Main St",
        }),
      );

      expect(john.address.street).toBe("123 Main St");
      expect(johnAfterMoving.address.street).toBe("456 Main St");
      expect(johnAfterMoving.address.$jazz.owner).not.toBe(john.$jazz.owner);
      expect(john.$jazz.updated().address).toBe(johnAfterMoving.address);
    });

    it("should update nested values with JSON data", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        address: { street: "123 Main St" },
      });

      const johnAfterMoving = john.$jazz.set("address", {
        street: "456 Main St",
      });

      expect(john.address.street).toBe("123 Main St");
      expect(johnAfterMoving.address.street).toBe("456 Main St");
      expect(john.$jazz.updated().address).toBe(johnAfterMoving.address);
      expect(johnAfterMoving.address.$jazz.owner).toBe(john.$jazz.owner);
    });

    it("should update nested values with self references", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      const john = Person.create({
        name: "John",
        age: 30,
        friend: {
          name: "Jane",
          age: 20,
        },
      });

      const johnWithANewFriend = john.$jazz.set("friend", {
        name: "Bob",
        age: 20,
      });

      expect(john.friend.name).toBe("Jane");
      expect(johnWithANewFriend.friend?.name).toBe("Bob");
      expect(john.$jazz.updated().friend).toBe(johnWithANewFriend.friend);

      const name = johnWithANewFriend.friend?.name;

      // TODO: It would be interesting to keep the Loaded type as non-nullable when returning updated values
      // because based on the set value we know for sure that the value is or is not undefined
      expectTypeOf<typeof name>().toMatchTypeOf<string | undefined>();
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
});
