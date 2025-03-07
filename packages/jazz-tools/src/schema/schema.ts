import { CoValueUniqueness } from "cojson";
import { TypeOf, ZodTypeAny, z } from "zod";
import { Account } from "../coValues/account.js";
import { Group } from "../coValues/group.js";
import { parseCoValueCreateOptions } from "../coValues/interfaces.js";
import { CoMapInstance, CoMapInstanceClass } from "./coMap.js";

export type CoMapInnerSchema = {
  [key: string]: CoMap<any> | ZodTypeAny | "self";
};

export type CoMapSchema<D extends CoMap<any>> = D extends CoMap<infer S>
  ? S
  : never;

export type CoValueDefinition<S extends CoMapInnerSchema> = CoMap<S>;

export type Relations<D extends CoValueDefinition<any>> = D extends CoMap<
  infer S
>
  ? {
      [K in keyof S]: S[K] extends CoMap<any>
        ? S[K]
        : S[K] extends "self"
          ? S
          : never;
    }
  : never;

export type RelationsKeys<D extends CoValueDefinition<any>> =
  keyof Relations<D> & (string | number);

export type CoValue<
  D extends CoValueDefinition<any>,
  R extends RelationsToResolve<D>,
> = CoMapInstance<D, R>;

export type RelationsToResolveStrict<
  T extends CoValueDefinition<any>,
  V,
> = V extends RelationsToResolve<T> ? RelationsToResolve<T> : V;

export type RelationsToResolve<
  D extends CoValueDefinition<any>,
  DepthLimit extends number = 5,
  CurrentDepth extends number[] = [],
> =
  | boolean
  | (DepthLimit extends CurrentDepth["length"]
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      : D extends CoMap<infer S>
        ?
            | {
                [K in keyof S]?: S[K] extends "self"
                  ? RelationsToResolve<D, DepthLimit, [0, ...CurrentDepth]>
                  : S[K] extends CoValueDefinition<any>
                    ? RelationsToResolve<S[K], DepthLimit, [0, ...CurrentDepth]>
                    : never;
              }
            | boolean
        : boolean);

type IsDepthLimit<
  Depth,
  DepthLimit extends number,
  CurrentDepth extends number[],
> = DepthLimit extends CurrentDepth["length"]
  ? true
  : Depth extends boolean | undefined
    ? true
    : keyof Depth extends never // Depth = {}
      ? true
      : false;

export type Loaded<
  D extends CoValueDefinition<any>,
  Depth extends RelationsToResolve<D>,
  DepthLimit extends number = 5,
  CurrentDepth extends number[] = [],
> = D extends CoMap<infer S>
  ? IsDepthLimit<Depth, DepthLimit, CurrentDepth> extends true
    ? {
        [K in keyof S]: S[K] extends ZodTypeAny ? TypeOf<S[K]> : null;
      }
    : {
        [K in keyof S]: K extends keyof Depth
          ? S[K] extends "self"
            ? Depth[K] extends RelationsToResolve<D>
              ? Loaded<D, Depth[K], DepthLimit, [0, ...CurrentDepth]>
              : never
            : S[K] extends CoValueDefinition<any>
              ? Depth[K] extends RelationsToResolve<S[K]>
                ? Loaded<S[K], Depth[K], DepthLimit, [0, ...CurrentDepth]>
                : never
              : never
          : S[K] extends ZodTypeAny
            ? TypeOf<S[K]>
            : never;
      }
  : never;

export type CoMapInit<D extends CoValueDefinition<any>> = D extends CoMap<
  infer S
>
  ? {
      [K in keyof S]: S[K] extends CoMap<any>
        ? CoMapInstance<D, any> | undefined
        : S[K] extends ZodTypeAny
          ? TypeOf<S[K]>
          : S[K] extends "self"
            ? CoMapInstance<D, any> | undefined
            : never;
    }
  : never;

export class CoMap<S extends CoMapInnerSchema> {
  protected schema: S;
  optional = true;

  constructor(schema: S) {
    this.schema = schema;
  }

  get(key: keyof S) {
    return this.schema[key];
  }

  keys() {
    return Object.keys(this.schema) as (keyof S)[];
  }

  create(
    init: CoMapInit<CoMap<S>>,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ) {
    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return CoMapInstanceClass.fromInit(this, init, owner, uniqueness);
  }
}

function map<S extends CoMapInnerSchema>(options: { schema: S }) {
  return new CoMap(options.schema);
}

export function isRelationRef(
  descriptor: CoMap<any> | ZodTypeAny | "self",
): descriptor is CoMap<any> | "self" {
  return descriptor instanceof CoMap || descriptor === "self";
}

export const co = {
  map,
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  object: z.object,
  union: z.union,
  intersection: z.intersection,
  tuple: z.tuple,
};

const MyMap = co.map({
  schema: {
    name: co.string(),
    age: co.number(),
    isAdmin: co.boolean(),
  },
});

const MyMap2 = co.map({
  schema: {
    name: co.string(),
    age: co.number(),
    isAdmin: co.boolean(),
    bestFriend: MyMap,
    self: "self",
  },
});

type MyMap2Resolved = Loaded<
  typeof MyMap2,
  { bestFriend: true; self: { self: true } }
>;
type MyMap2Resolved2 = Loaded<typeof MyMap2, true>;

type MyMap2Init = CoMapInstance<typeof MyMap2, true>;

const myMap = MyMap2.create({
  name: "John",
  age: 20,
  isAdmin: true,
  bestFriend: undefined,
  self: undefined,
});
