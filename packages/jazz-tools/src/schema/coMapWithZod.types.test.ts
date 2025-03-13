import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { createJazzTestAccount } from "../testing.js";
import {
  AnyCoMapSchemaDefinition,
  CoMapInit,
  CoMapInitStrict,
  CoMapInitToRelationsToResolve,
  CoMapSchemaDefinition,
  CoValueSchema,
  UnwrapReference,
} from "./coMap/schema.js";
import { CoMap, Loaded, RelationsToResolve, co, z } from "./schema.js";

beforeEach(async () => {
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("CoMap - with zod based schema", () => {
  describe("RelationsToResolve", () => {
    it("should properly parse a schema without relations", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
      });

      type Result = RelationsToResolve<typeof Person>;

      expectTypeOf<Result>().toEqualTypeOf<true>();
    });

    it("should properly parse a schema with a relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type Result = RelationsToResolve<typeof Person>;

      expectTypeOf<Result>().toEqualTypeOf<
        | true
        | {
            address?: true;
          }
      >();
    });

    it("should properly parse a schema with a self reference", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      type Result = RelationsToResolve<typeof Person>;

      expectTypeOf<Result>().toMatchTypeOf<
        | true
        | {
            friend?:
              | true
              | {
                  friend?:
                    | true
                    | {
                        friend?:
                          | true
                          | {
                              friend?:
                                | true
                                | {
                                    friend?: true;
                                  };
                            };
                      };
                };
          }
      >();
    });

    it("should return the same result when providing a SchemaDefinition", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type PersonSchema = typeof Person;
      type PersonSchemaDefinition = CoMapSchemaDefinition<
        PersonSchema["shape"],
        PersonSchema["record"],
        PersonSchema["isOptional"]
      >;
      type Result = RelationsToResolve<PersonSchemaDefinition>;

      expectTypeOf<Result>().toEqualTypeOf<
        | true
        | {
            address?: true;
          }
      >();
    });
  });

  describe("Loaded", () => {
    it("should properly parse a schema without relations", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
      });

      type Result = Loaded<typeof Person, true>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
        } & CoMap<typeof Person, true>
      >();
    });

    it("should properly parse a schema with a relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type Result = Loaded<typeof Person, true>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          address: null;
        } & CoMap<typeof Person, true>
      >();
    });

    it("should properly parse a schema with a relation {address: true}", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type Result = Loaded<typeof Person, { address: true }>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          address: {
            street: string;
          } & CoMap<typeof Person.shape.address, true>;
        } & CoMap<typeof Person, { address: true }>
      >();
    });

    it("should properly parse a schema with an optional relation {address: true}", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co
          .map({
            street: z.string(),
          })
          .optional(),
      });

      type Result = Loaded<typeof Person, { address: true }>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          address:
            | ({
                street: string;
              } & CoMap<typeof Person.shape.address, true>)
            | null
            | undefined;
        } & CoMap<typeof Person, { address: true }>
      >();
    });

    it("should properly parse a schema with a self reference", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      type Result = Loaded<typeof Person, true>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          friend: null;
        } & CoMap<typeof Person, true>
      >();
    });

    it("should properly parse a schema with a self reference {friend: true}", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      type Result = Loaded<typeof Person, { friend: true }>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          friend:
            | ({
                name: string;
                age: number;
                friend: null;
              } & CoMap<typeof Person, true>)
            | null
            | undefined;
        } & CoMap<typeof Person, { friend: true }>
      >();
    });

    it("should return the same result when providing a SchemaDefinition", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type PersonSchema = typeof Person;
      type PersonSchemaDefinition = CoMapSchemaDefinition<
        PersonSchema["shape"],
        PersonSchema["record"],
        PersonSchema["isOptional"]
      >;
      type Result = Loaded<PersonSchemaDefinition, true>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          address: null;
        } & CoMap<typeof Person, true>
      >();
    });

    it("should return the same result when providing a SchemaDefinition {address: true}", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type PersonSchema = typeof Person;
      type PersonSchemaDefinition = CoMapSchemaDefinition<
        PersonSchema["shape"],
        PersonSchema["record"],
        PersonSchema["isOptional"]
      >;
      type Result = Loaded<PersonSchemaDefinition, { address: true }>;

      expectTypeOf<Result>().toMatchTypeOf<
        {
          name: string;
          age: number;
          address: {
            street: string;
          } & CoMap<typeof Person.shape.address, true>;
        } & CoMap<typeof Person, { address: true }>
      >();
    });
  });

  describe("CoMapInit", () => {
    it("should properly parse a schema without relations", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number().optional(),
      });

      type Result = CoMapInit<typeof Person>;

      expectTypeOf<Result>().toMatchTypeOf<{
        name: string;
        age?: number;
      }>();
    });

    it("should properly parse a schema with a relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type Result = CoMapInit<typeof Person>;

      expectTypeOf<Result>().toMatchTypeOf<{
        name: string;
        age: number;
        address:
          | {
              street: string;
            }
          | ({
              street: string;
            } & CoMap<typeof Person.shape.address, true>);
      }>();
    });

    it("should properly parse a schema with an optional relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co
          .map({
            street: z.string(),
          })
          .optional(),
      });

      type Result = CoMapInit<typeof Person>;

      expectTypeOf<Result>().toMatchTypeOf<{
        name: string;
        age: number;
        address?:
          | {
              street: string;
            }
          | ({
              street: string;
            } & CoMap<typeof Person.shape.address, true>);
      }>();
    });

    it("should properly parse a schema with a self reference", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      // This is just for debug, writing an expectation is not possible
      type Result = CoMapInit<typeof Person>;
    });

    it("should return the same result when providing a SchemaDefinition", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type PersonSchema = typeof Person;
      type PersonSchemaDefinition = CoMapSchemaDefinition<
        PersonSchema["shape"],
        PersonSchema["record"],
        PersonSchema["isOptional"]
      >;
      type Result = CoMapInit<PersonSchemaDefinition>;

      expectTypeOf<Result>().toMatchTypeOf<{
        name: string;
        age: number;
        address?:
          | {
              street: string;
            }
          | ({
              street: string;
            } & CoMap<typeof Person.shape.address, true>);
      }>();
    });
  });

  describe("CoMapInitToRelationsToResolve", () => {
    it("should properly parse a schema without relations", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
      });

      type Result = CoMapInitToRelationsToResolve<
        typeof Person,
        {
          name: string;
          age: number;
        }
      >;

      expectTypeOf<Result>().toEqualTypeOf<true>();
    });

    it("should properly parse a schema with a relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type Result = CoMapInitToRelationsToResolve<
        typeof Person,
        {
          name: string;
          age: number;
          address: {
            street: string;
          };
        }
      >;

      expectTypeOf<Result>().toEqualTypeOf<{
        address: true;
      }>();
    });

    it("should properly parse a schema with a self reference", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      type Result = CoMapInitToRelationsToResolve<
        typeof Person,
        {
          name: string;
          age: number;
          friend: {
            name: string;
            age: number;
          };
        }
      >;

      expectTypeOf<Result>().toEqualTypeOf<{
        friend: true;
      }>();
    });

    it("should return the same result when providing a SchemaDefinition", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type PersonSchema = typeof Person;
      type PersonSchemaDefinition = CoMapSchemaDefinition<
        PersonSchema["shape"],
        PersonSchema["record"],
        PersonSchema["isOptional"]
      >;
      type Result = RelationsToResolve<PersonSchemaDefinition>;

      expectTypeOf<Result>().toEqualTypeOf<
        | true
        | {
            address?: true;
          }
      >();
    });
  });

  describe("CoMapInitStrict", () => {
    it("should properly parse a schema without relations", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number().optional(),
      });

      type Ok = CoMapInitStrict<
        typeof Person,
        {
          name: string;
        }
      >;

      expectTypeOf<Ok>().toEqualTypeOf<{
        name: string;
        age?: number;
      }>();

      type Fail = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          age: string;
          anotherField: string;
        }
      >;

      expectTypeOf<Fail>().toEqualTypeOf<{
        name: string;
        age: string;
        anotherField: string;
      }>();
    });

    it("should properly parse a schema with a relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type Ok = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          age: number;
          address: {
            street: string;
          };
        }
      >;

      expectTypeOf<Ok>().toEqualTypeOf<CoMapInit<typeof Person>>();

      type Fail = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          anotherField: string;
        }
      >;

      expectTypeOf<Fail>().toEqualTypeOf<{
        name: string;
        anotherField: string;
      }>();
    });

    it("should properly parse a schema with an optional relation", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co
          .map({
            street: z.string(),
          })
          .optional(),
      });

      type Ok = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          age: number;
        }
      >;

      expectTypeOf<Ok>().toEqualTypeOf<CoMapInit<typeof Person>>();

      type Fail = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          anotherField: string;
        }
      >;

      expectTypeOf<Fail>().toEqualTypeOf<{
        name: string;
        anotherField: string;
      }>();
    });

    it("should properly parse a schema with a self reference", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        friend: co.self(),
      });

      type Ok = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          age: number;
          friend: {
            name: string;
            age: number;
          };
        }
      >;

      type Ok2 = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          age: number;
        }
      >;

      expectTypeOf<Ok>().toEqualTypeOf<CoMapInit<typeof Person>>();
      expectTypeOf<Ok2>().toEqualTypeOf<CoMapInit<typeof Person>>();

      type Fail = CoMapInitStrict<
        typeof Person,
        {
          name: string;
          anotherField: string;
        }
      >;

      expectTypeOf<Fail>().toEqualTypeOf<{
        name: string;
        anotherField: string;
      }>();
    });

    it("should return the same result when providing a SchemaDefinition", () => {
      const Person = co.map({
        name: z.string(),
        age: z.number(),
        address: co.map({
          street: z.string(),
        }),
      });

      type PersonSchema = typeof Person;
      type PersonSchemaDefinition = CoMapSchemaDefinition<
        PersonSchema["shape"],
        PersonSchema["record"],
        PersonSchema["isOptional"]
      >;
      type Ok = CoMapInitStrict<
        PersonSchemaDefinition,
        {
          name: string;
          age: number;
          address: {
            street: string;
          };
        }
      >;

      expectTypeOf<Ok>().toEqualTypeOf<CoMapInit<typeof Person>>();

      type Fail = CoMapInitStrict<
        PersonSchemaDefinition,
        {
          name: string;
          anotherField: string;
        }
      >;

      expectTypeOf<Fail>().toEqualTypeOf<{
        name: string;
        anotherField: string;
      }>();
    });
  });
});
