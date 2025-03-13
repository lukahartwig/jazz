import { CoValueUniqueness } from "cojson";
import { TypeOf, ZodString, ZodTypeAny, z } from "zod";
import { Account } from "../../coValues/account.js";
import { Group } from "../../coValues/group.js";
import { parseCoValueCreateOptions } from "../../internal.js";
import { addOptional, carryOptional, optional } from "../coValue/optional.js";
import { SelfReference, markSelfReferenceAsOptional } from "../coValue/self.js";
import {
  IsDepthLimit,
  addQuestionMarks,
  flatten,
} from "../coValue/typeUtils.js";
import { Loaded, LoadedCoMap, ValidateResolve } from "../coValue/types.js";
import { createCoMap } from "./instance.js";
import { RecordDefinition, RecordSymbol } from "./record.js";

export type CoMapSchemaField = CoMapSchema<any> | ZodTypeAny | SelfReference;

export type CoMapSchemaShape = {
  [RecordSymbol]?: RecordDefinition<any, CoMapSchemaField>;
} & {
  [key: string]: CoMapSchemaField;
};

export type RecordKeyType<S extends CoMapSchema<any>> =
  S["shape"][RecordSymbol] extends RecordDefinition<any, any>
    ? TypeOf<S["shape"][RecordSymbol]["key"]>
    : never;

export type RecordValueType<S extends CoMapSchema<any>> =
  S["shape"][RecordSymbol] extends RecordDefinition<any, any>
    ? S["shape"][RecordSymbol]["value"]
    : never;

export type CoMapSchemaKey<S extends CoMapSchema<any>> = Exclude<
  keyof S["shape"],
  RecordSymbol
>;

export type CoMapFieldType<
  S extends CoMapSchema<any>,
  K extends CoMapSchemaKey<S>,
> = S["shape"][K] extends CoMapSchemaField ? S["shape"][K] : never;

export type CoValueSchema<S extends CoMapSchemaShape> = CoMapSchema<S>;

export type UnwrapReference<
  D extends CoMapSchema<any>,
  K extends CoMapSchemaKey<D>,
> = CoMapFieldType<D, K> extends CoValueSchema<any>
  ? CoMapFieldType<D, K>
  : CoMapFieldType<D, K> extends SelfReference
    ? D
    : never;

export type CoMapInit<
  D extends CoMapSchema<any>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? {}
  : addQuestionMarks<{
      [K in CoMapSchemaKey<D>]: CoMapFieldType<D, K> extends ZodTypeAny
        ? TypeOf<CoMapFieldType<D, K>>
        : UnwrapReference<D, K> extends CoMapSchema<any>
          ?
              | CoMapInit<UnwrapReference<D, K>, [0, ...CurrentDepth]>
              | LoadedCoMap<UnwrapReference<D, K>, any>
              | addOptional<UnwrapReference<D, K>>
              | markSelfReferenceAsOptional<CoMapFieldType<D, K>> // Self references are always optional
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
      [K in CoMapSchemaKey<D>]?: CoMapFieldType<D, K> extends ZodTypeAny
        ? TypeOf<CoMapFieldType<D, K>>
        : any;
    };

export type CoMapInitToRelationsToResolve<
  S extends CoMapSchemaShape,
  I extends CoMapSimpleInit<CoMapSchema<S>>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? true
  : ValidateResolve<
      CoMapSchema<S>,
      {
        [K in CoMapSchemaKey<CoMapSchema<S>>]: UnwrapReference<
          CoMapSchema<S>,
          K
        > extends CoMapSchema<infer ChildSchema>
          ? I[K] extends LoadedCoMap<CoMapSchema<ChildSchema>, infer R>
            ? R
            : I[K] extends CoMapSimpleInit<CoMapSchema<ChildSchema>>
              ? CoMapInitToRelationsToResolve<
                  ChildSchema,
                  I[K],
                  [0, ...CurrentDepth]
                >
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
    const descriptor = this.shape[key];

    if (descriptor) {
      return descriptor;
    }

    return this.getRecordDescriptor(key);
  }

  keys() {
    return Object.keys(this.shape) as (keyof S & string)[];
  }

  getRecordDescriptor(key: CoMapSchemaKey<CoMapSchema<S>>) {
    if (!this.shape[RecordSymbol]) {
      return undefined;
    }

    const { key: keySchema, value } = this.shape[RecordSymbol];

    if (!keySchema.safeParse(key).success) {
      return undefined;
    }

    return value;
  }

  isRecord() {
    return this.shape[RecordSymbol] !== undefined;
  }

  catchall<V extends CoMapSchemaField>(descriptor: V) {
    const newShape = {
      [RecordSymbol]: { key: z.string(), value: descriptor },
      ...this.shape,
    };

    const newSchema = new CoMapSchema(newShape);

    return carryOptional(this, newSchema);
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
    CoMapInitToRelationsToResolve<S, I>,
    "non-nullable" // We want the loaded type to reflect the init input as we know for sure if values are available or not
  > {
    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return createCoMap<CoMapSchema<S>>(this, init, owner, uniqueness) as any;
  }
}
