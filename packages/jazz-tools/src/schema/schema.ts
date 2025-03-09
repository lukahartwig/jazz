import { CoValueUniqueness } from "cojson";
import { TypeOf, ZodTypeAny, z } from "zod";
import type { Account } from "../coValues/account.js";
import type { Group } from "../coValues/group.js";
import { RefsToResolve, parseCoValueCreateOptions } from "../internal.js";
import { CoMapInstanceClass } from "./coMap.js";

type DEPTH_LIMIT = 5;

type IsDepthLimit<CurrentDepth extends number[]> =
  DEPTH_LIMIT extends CurrentDepth["length"] ? true : false;

export type CoMapSchemaDefinition = {
  [key: string]: CoMap<any> | ZodTypeAny;
};

export type CoValueDefinition<S extends CoMapSchemaDefinition> = CoMap<S>;

export type Relations<D extends CoValueDefinition<any>> = D extends CoMap<
  infer S
>
  ? {
      [K in keyof S]: S[K] extends CoMap<any> ? S[K] : never;
    }
  : never;

export type RelationsKeys<D extends CoValueDefinition<any>> =
  keyof Relations<D> & (string | number);

export type CoValue<
  D extends CoValueDefinition<any>,
  R extends RelationsToResolve<D>,
> = LoadedCoMap<D, R>;

export type RelationsToResolveStrict<
  T extends CoValueDefinition<any>,
  V,
> = V extends RelationsToResolve<T> ? RelationsToResolve<T> : V;

export type RelationsToResolve<
  D extends CoValueDefinition<any>,
  CurrentDepth extends number[] = [],
> =
  | boolean
  | (IsDepthLimit<CurrentDepth> extends true
      ? boolean
      : D extends CoMap<infer S>
        ?
            | {
                [K in keyof S]?: S[K] extends CoValueDefinition<any>
                  ? RelationsToResolve<S[K], [0, ...CurrentDepth]>
                  : never;
              }
            | boolean
        : boolean);

type isResolveLeaf<Depth> = Depth extends boolean | undefined
  ? true
  : keyof Depth extends never // Depth = {}
    ? true
    : false;

export type Loaded<
  D extends CoValueDefinition<any>,
  Depth extends RelationsToResolve<D>,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = Depth extends never
  ? D
  : D extends CoMap<infer S>
    ? LoadedCoMap<CoMap<S>, Depth, Options, CurrentDepth>
    : D;

type UnwrapZodType<T, O = null> = T extends ZodTypeAny ? TypeOf<T> : O;

type ValidateResolve<
  D extends CoValueDefinition<any>,
  I,
  E,
> = I extends RelationsToResolve<D> ? I : E;

type addNullable<O extends "nullable" | "non-nullable"> = O extends "nullable"
  ? null
  : never;

export type LoadedCoMap<
  D extends CoMap<any>,
  Depth extends RelationsToResolve<D>,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = CoMapInstanceClass<D, Depth> &
  (D extends CoMap<infer S>
    ? IsDepthLimit<CurrentDepth> & isResolveLeaf<Depth> extends true // The & here is used as OR operator
      ? {
          [K in keyof S]: UnwrapZodType<S[K]>;
        }
      : {
          [K in keyof S]: K extends keyof Depth
            ? S[K] extends CoValueDefinition<any>
              ? Depth[K] extends RelationsToResolve<S[K]>
                ?
                    | Loaded<S[K], Depth[K], Options, [0, ...CurrentDepth]>
                    | addNullable<Options>
                : null
              : UnwrapZodType<S[K]>
            : UnwrapZodType<S[K]>;
        }
    : never);

export type CoMapInit<D extends CoMap<any>> = D extends CoMap<infer S>
  ? {
      [K in keyof S]?: S[K] extends ZodTypeAny
        ? TypeOf<S[K]>
        : S[K] extends CoMap<any>
          ? CoMapInit<S[K]> | LoadedCoMap<S[K], any> | undefined
          : never;
    }
  : never;

export type CoMapInitStrict<D extends CoMap<any>, I> = I extends CoMapInit<D>
  ? CoMapInit<D>
  : I;

type CoMapInitToRelationsToResolve<
  S extends CoMapSchemaDefinition,
  I extends CoMapInit<CoMap<S>>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? true
  : {
      [K in keyof S]: S[K] extends CoMap<infer ChildSchema>
        ? I[K] extends LoadedCoMap<CoMap<ChildSchema>, infer R>
          ? ValidateResolve<S[K], R, never>
          : I[K] extends CoMapInit<CoMap<ChildSchema>>
            ? ValidateResolve<
                S[K],
                CoMapInitToRelationsToResolve<
                  ChildSchema,
                  I[K],
                  [0, ...CurrentDepth]
                >,
                never
              >
            : never
        : never;
    };

export class CoMap<S extends CoMapSchemaDefinition> {
  schema: S;
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

  create<I extends CoMapInit<CoMap<S>>>(
    init: CoMapInitStrict<CoMap<S>, I>,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ): Loaded<CoMap<S>, CoMapInitToRelationsToResolve<S, I>> {
    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return CoMapInstanceClass.fromInit<CoMap<S>>(
      this,
      init,
      owner,
      uniqueness,
    ) as any;
  }
}

function map<S extends CoMapSchemaDefinition>(schema: S) {
  return new CoMap(schema);
}

export function isRelationRef(
  descriptor: CoMap<any> | ZodTypeAny,
): descriptor is CoMap<any> {
  return descriptor instanceof CoMap;
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
