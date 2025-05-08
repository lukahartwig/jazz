import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import {
  assert,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  test,
  vi,
} from "vitest";
import { RefsToResolve } from "../coValues/deepLoading.js";
import { ID } from "../coValues/interfaces.js";
import { Group, Resolved, subscribeToCoValue } from "../exports.js";
import { Account, CoMap, co, cojsonInternals } from "../index.js";
import { createJazzTestAccount, setupJazzTestSync } from "../testing.js";
import { waitFor } from "./utils.js";

const { connectedPeers } = cojsonInternals;

const Crypto = await WasmCrypto.create();

beforeEach(async () => {
  await setupJazzTestSync();

  await createJazzTestAccount({
    isCurrentActiveAccount: true,
    creationProps: { name: "Hermes Puggington" },
  });
});

describe("CoMap.Record", async () => {
  describe("init", () => {
    test("create a Record with basic property access", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({
        name: "John",
        age: "20",
      });

      expect(person.name).toEqual("John");
      expect(person.age).toEqual("20");
      expect(Object.keys(person)).toEqual(["name", "age"]);
    });

    test("property existence", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({ name: "John" });

      expect("name" in person).toEqual(true);
      expect("age" in person).toEqual(false);
    });

    test("create a Record with an account as owner", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({ name: "John" }, Account.getMe());

      expect(person.name).toEqual("John");
      expect(person._raw.get("name")).toEqual("John");
    });

    test("create a Record with a group as owner", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({ name: "John" }, Group.create());

      expect(person.name).toEqual("John");
      expect(person._raw.get("name")).toEqual("John");
    });

    test("Empty schema", () => {
      class EmptyRecord extends CoMap.Record(co.string) {}
      const emptyRecord = EmptyRecord.create({});

      expect(Object.keys(emptyRecord)).toEqual([]);
    });

    test("Record with reference", () => {
      class Dog extends CoMap {
        name = co.string;
        breed = co.string;
      }

      class Person
        extends CoMap.Record(co.ref(Dog, { optional: true }))
        implements Record<string, Dog | null | undefined> {}

      const person = Person.create({
        pet1: Dog.create({ name: "Rex", breed: "Labrador" }),
        pet2: Dog.create({ name: "Fido", breed: "Poodle" }),
      });

      expect(person.pet1?.name).toEqual("Rex");
      expect(person.pet1?.breed).toEqual("Labrador");
      expect(person.pet2?.name).toEqual("Fido");
      expect(person.pet2?.breed).toEqual("Poodle");
    });
  });

  describe("Mutation", () => {
    test("change a primitive value", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({ name: "John" });

      person.name = "Jane";

      expect(person.name).toEqual("Jane");
    });

    test("delete a value", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({ name: "John", age: "20" });

      delete person.age;

      expect(person.name).toEqual("John");
      expect("age" in person).toEqual(false);

      expect(person.toJSON()).toEqual({
        _type: "CoMap",
        id: person.id,
        name: "John",
      });
    });

    test("update a reference", () => {
      class Dog extends CoMap {
        name = co.string;
      }

      class Person
        extends CoMap.Record(co.ref(Dog, { optional: true }))
        implements Record<string, Dog | null | undefined> {}

      const person = Person.create({
        pet1: Dog.create({ name: "Rex" }),
      });

      person.pet1 = Dog.create({ name: "Fido" });

      expect(person.pet1?.name).toEqual("Fido");
    });

    test("changes should be listed in _edits", () => {
      class Person extends CoMap.Record(co.string) {}

      const person = Person.create({ name: "John" });

      const me = Account.getMe();

      person.name = "Jane";

      const edits = person._edits.name?.all;
      expect(edits).toEqual([
        {
          by: expect.objectContaining({ _type: "Account", id: me.id }),
          value: "John",
          key: "name",
          ref: undefined,
          madeAt: expect.any(Date),
        },
        {
          by: expect.objectContaining({ _type: "Account", id: me.id }),
          value: "Jane",
          key: "name",
          ref: undefined,
          madeAt: expect.any(Date),
        },
      ]);
    });
  });

  describe("Record resolution", async () => {
    test("loading a locally available record with deep resolve", async () => {
      class Dog extends CoMap {
        name = co.string;
        breed = co.string;
      }

      class Person
        extends CoMap.Record(co.ref(Dog, { optional: true }))
        implements Record<string, Dog | null | undefined> {}

      const person = Person.create({
        pet1: Dog.create({ name: "Rex", breed: "Labrador" }),
        pet2: Dog.create({ name: "Fido", breed: "Poodle" }),
      });

      const loadedPerson = await Person.load(person.id as ID<Person>, {
        resolve: {
          $each: true,
        },
      });

      assert(loadedPerson);
      expect(loadedPerson.pet1?.name).toEqual("Rex");
      expect(loadedPerson.pet2?.name).toEqual("Fido");
    });

    test("loading a locally available record using autoload for the refs", async () => {
      class Dog extends CoMap {
        name = co.string;
        breed = co.string;
      }

      class Person
        extends CoMap.Record(co.ref(Dog, { optional: true }))
        implements Record<string, Dog | null | undefined> {}

      const person = Person.create({
        pet1: Dog.create({ name: "Rex", breed: "Labrador" }),
        pet2: Dog.create({ name: "Fido", breed: "Poodle" }),
      });

      const loadedPerson = await Person.load(person.id as ID<Person>);

      assert(loadedPerson);
      expect(loadedPerson.pet1?.name).toEqual("Rex");
      expect(loadedPerson.pet2?.name).toEqual("Fido");
    });

    test("subscription on a locally available record with deep resolve", async () => {
      class Dog extends CoMap {
        name = co.string;
        breed = co.string;
      }

      class Person
        extends CoMap.Record(co.ref(Dog, { optional: true }))
        implements Record<string, Dog | null | undefined> {}

      const person = Person.create({
        pet1: Dog.create({ name: "Rex", breed: "Labrador" }),
      });

      const updates: Resolved<Person, { $each: true }>[] = [];
      const spy = vi.fn((person) => updates.push(person));

      Person.subscribe(
        person.id as ID<Person>,
        {
          resolve: {
            $each: true,
          },
        },
        spy,
      );

      expect(spy).not.toHaveBeenCalled();

      await waitFor(() => expect(spy).toHaveBeenCalled());

      expect(spy).toHaveBeenCalledTimes(1);

      expect(updates[0]?.pet1?.name).toEqual("Rex");

      person.pet1 = Dog.create({ name: "Fido", breed: "Poodle" });

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));

      expect(updates[1]?.pet1?.name).toEqual("Fido");

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Record Typescript validation", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    class NestedRecord extends CoMap {
      value = co.string;
    }

    test("Is not ok to pass null into a required ref", () => {
      class TestRecord
        extends CoMap.Record(co.ref(NestedRecord))
        implements Record<string, NestedRecord | null> {}

      expectTypeOf<typeof TestRecord.create>().toBeCallableWith(
        {
          key1: NestedRecord.create({ value: "" }, { owner: me }),
          key2: NestedRecord.create({ value: "" }, { owner: me }),
        },
        { owner: me },
      );

      expectTypeOf<typeof TestRecord.create>().toBeCallableWith(
        {
          key1: NestedRecord.create({ value: "" }, { owner: me }),
          key2: null,
        },
        { owner: me },
      );
    });

    test("Is ok to omit optional fields", () => {
      class TestRecord
        extends CoMap.Record(co.ref(NestedRecord, { optional: true }))
        implements Record<string, NestedRecord | null | undefined> {}

      expectTypeOf<typeof TestRecord.create>().toBeCallableWith(
        {
          key1: NestedRecord.create({ value: "" }, { owner: me }),
        },
        { owner: me },
      );

      expectTypeOf<typeof TestRecord.create>().toBeCallableWith(
        {
          key1: NestedRecord.create({ value: "" }, { owner: me }),
          key2: null,
        },
        { owner: me },
      );
    });
  });
});
