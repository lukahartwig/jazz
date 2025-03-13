import { CoValueUniqueness } from "cojson";
import { TypeOf, ZodString, ZodTypeAny, z } from "zod";
import { Account } from "../../coValues/account.js";
import { Group } from "../../coValues/group.js";
import { parseCoValueCreateOptions } from "../../internal.js";
import { addOptional, carryOptional, optional } from "../coValue/optional.js";
import { SelfReference, markSelfReferenceAsOptional } from "../coValue/self.js";
import { IsDepthLimit, addQuestionMarks } from "../coValue/typeUtils.js";
import { Loaded, LoadedCoMap, ValidateResolve } from "../coValue/types.js";
import { CoMap, createCoMap } from "./instance.js";

export type CoMapFieldDescriptor =
  | CoMapSchema<any>
  | ZodTypeAny
  | SelfReference;

export type CoMapSchemaShape = {
  [key: string]: CoMapFieldDescriptor;
};

export type CoMapSchemaKey<S extends CoMapSchema<any>> = keyof S["shape"];

export type CoMapFieldDescriptorType<
  S extends CoMapSchema<any>,
  K extends CoMapSchemaKey<S>,
> = S["shape"][K] extends CoMapFieldDescriptor ? S["shape"][K] : never;

export type CoValueSchema<S extends CoMapSchemaShape> = CoMapSchema<S>;

export type UnwrapReference<
  D extends CoMapSchema<any>,
  K extends CoMapSchemaKey<D>,
> = CoMapFieldDescriptorType<D, K> extends CoValueSchema<any>
  ? CoMapFieldDescriptorType<D, K>
  : CoMapFieldDescriptorType<D, K> extends SelfReference
    ? D
    : never;

export type CoMapInit<
  D extends CoMapSchema<any>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? {}
  : addQuestionMarks<{
      [K in CoMapSchemaKey<D>]: CoMapFieldDescriptorType<
        D,
        K
      > extends ZodTypeAny
        ? TypeOf<CoMapFieldDescriptorType<D, K>>
        : UnwrapReference<D, K> extends CoMapSchema<any>
          ?
              | CoMapInit<UnwrapReference<D, K>, [0, ...CurrentDepth]>
              | LoadedCoMap<UnwrapReference<D, K>, any>
              | addOptional<UnwrapReference<D, K>>
              | markSelfReferenceAsOptional<CoMapFieldDescriptorType<D, K>> // Self references are always optional
          : never;
    }>;

export type CoMapInitStrict<
  D extends CoMapSchema<any>,
  I,
> = I extends CoMapInit<D> ? CoMapInit<D> : I;

/**
 * This is a simplified version of CoMapInit that only includes the keys that are defined in the schema.
 * It is used to build the resolve type for the create method without paying the compelxity cost of the full CoMapInit.
 */
type CoMapSimpleInit<
  D extends CoMapSchema<any>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? {}
  : {
      [K in CoMapSchemaKey<D>]?: CoMapFieldDescriptorType<
        D,
        K
      > extends ZodTypeAny
        ? TypeOf<CoMapFieldDescriptorType<D, K>>
        : any;
    };

export type CoMapInitToRelationsToResolve<
  S extends CoMapSchema<any>,
  I extends CoMapSimpleInit<S>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? true
  : ValidateResolve<
      S,
      {
        [K in CoMapSchemaKey<S>]: UnwrapReference<
          S,
          K
        > extends infer ChildSchema
          ? ChildSchema extends CoMapSchema<any>
            ? I[K] extends CoMap<ChildSchema, infer R>
              ? R
              : I[K] extends CoMapSimpleInit<ChildSchema>
                ? CoMapInitToRelationsToResolve<
                    ChildSchema,
                    I[K],
                    [0, ...CurrentDepth]
                  >
                : never
            : never
          : never;
      },
      true
    >;

export class CoMapSchema<S extends CoMapSchemaShape> {
  shape: S;

  constructor(schema: S) {
    this.shape = schema;
  }

  optional() {
    return optional(this);
  }

  get(key: CoMapSchemaKey<CoMapSchema<S>>) {
    return this.shape[key];
  }

  keys() {
    return Object.keys(this.shape) as (keyof S & string)[];
  }

  create<I extends CoMapInit<CoMapSchema<S>>>(
    init: CoMapInitStrict<CoMapSchema<S>, I>,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ): Loaded<
    CoMapSchema<S>,
    CoMapInitToRelationsToResolve<CoMapSchema<S>, I>,
    "non-nullable" // We want the loaded type to reflect the init input as we know for sure if values are available or not
  > {
    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return createCoMap<CoMapSchema<S>>(this, init, owner, uniqueness) as any;
  }
}
