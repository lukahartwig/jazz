import { CoValueUniqueness } from "cojson";
import { TypeOf, ZodString, ZodTypeAny, z } from "zod";
import { Account } from "../../coValues/account.js";
import { Group } from "../../coValues/group.js";
import { parseCoValueCreateOptions } from "../../internal.js";
import { addOptional } from "../coValue/optional.js";
import { SelfReference, markSelfReferenceAsOptional } from "../coValue/self.js";
import {
  IsDepthLimit,
  addQuestionMarks,
  flatten,
} from "../coValue/typeUtils.js";
import { Loaded, LoadedCoMap, ValidateResolve } from "../coValue/types.js";
import { CoMap, createCoMap } from "./instance.js";

export type CoMapField =
  | CoMapSchema<any, undefined>
  | CoMapSchema<any, CoMapRecordDef>
  | ZodTypeAny
  | SelfReference;
export type CoMapRecordDef = { key: ZodString; value: CoMapField };

export type CoMapSchemaShape = {
  [key: string]: CoMapField;
};

export type CoMapSchemaKey<S extends AnyCoMapSchemaDefinition> =
  | keyof S["shape"]
  | CoMapRecordKey<S>;

export type CoMapRecordKey<S extends AnyCoMapSchemaDefinition> =
  S["record"] extends CoMapRecordDef ? TypeOf<S["record"]["key"]> : never;

export type CoMapRecordFieldType<S extends AnyCoMapSchemaDefinition> =
  S["record"] extends CoMapRecordDef ? S["record"]["value"] : never;

export type CoMapFieldType<
  S extends AnyCoMapSchemaDefinition,
  K extends CoMapSchemaKey<S>,
> = S["shape"][K] extends CoMapField
  ? S["shape"][K]
  : S["record"] extends CoMapRecordDef
    ? K extends TypeOf<S["record"]["key"]>
      ? S["record"]["value"]
      : never
    : never;

export type CoValueSchema = AnyCoMapSchema;
export type CoValueSchemaDefinition = AnyCoMapSchemaDefinition;

export type UnwrapRecordReference<S extends AnyCoMapSchemaDefinition> =
  CoMapRecordFieldType<S> extends CoValueSchema
    ? CoMapRecordFieldType<S>
    : CoMapRecordFieldType<S> extends SelfReference
      ? S
      : never;

export type UnwrapReference<
  S extends AnyCoMapSchemaDefinition,
  K extends CoMapSchemaKey<S>,
> = S["shape"][K] extends CoValueSchema
  ? S["shape"][K]
  : S["shape"][K] extends SelfReference
    ? S extends CoMapSchema<infer S, infer R>
      ? CoMapSchema<S, R, true>
      : never
    : never;

export type CoMapInit<
  S extends AnyCoMapSchemaDefinition,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? {}
  : flatten<
      addQuestionMarks<{
        [K in keyof S["shape"]]: CoMapFieldType<S, K> extends ZodTypeAny
          ? TypeOf<CoMapFieldType<S, K>>
          : UnwrapReference<S, K> extends AnyCoMapSchema
            ?
                | CoMapInit<UnwrapReference<S, K>, [0, ...CurrentDepth]>
                | LoadedCoMap<UnwrapReference<S, K>, any>
                | addOptional<UnwrapReference<S, K>>
                | markSelfReferenceAsOptional<CoMapFieldType<S, K>> // Self references are always optional
            : never;
      }>
    > &
      (S["record"] extends undefined
        ? unknown
        : Record<
            CoMapRecordKey<S>,
            CoMapRecordFieldType<S> extends ZodTypeAny
              ? TypeOf<CoMapRecordFieldType<S>>
              : UnwrapRecordReference<S> extends AnyCoMapSchema
                ?
                    | CoMapInit<UnwrapRecordReference<S>, [0, ...CurrentDepth]>
                    | LoadedCoMap<UnwrapRecordReference<S>, any>
                    | addOptional<UnwrapRecordReference<S>>
                    | markSelfReferenceAsOptional<CoMapRecordFieldType<S>> // Self references are always optional
                : never
          >);

export type CoMapInitStrict<
  S extends AnyCoMapSchemaDefinition,
  I,
> = I extends CoMapInit<S> ? CoMapInit<S> : I;

/**
 * This is a simplified version of CoMapInit that only includes the keys that are defined in the schema.
 * It is used to build the resolve type for the create method without paying the compelxity cost of the full CoMapInit.
 */
type CoMapSimpleInit<
  S extends AnyCoMapSchemaDefinition,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? {}
  : {
      [K in keyof S["shape"]]?: CoMapFieldType<S, K> extends ZodTypeAny
        ? TypeOf<CoMapFieldType<S, K>>
        : any;
    } & (S["record"] extends undefined
      ? unknown
      : {
          [K in CoMapRecordKey<S>]: CoMapRecordFieldType<S> extends ZodTypeAny
            ? TypeOf<CoMapRecordFieldType<S>>
            : any;
        });

export type CoMapInitToRelationsToResolve<
  S extends AnyCoMapSchemaDefinition,
  I,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? true
  : I extends CoMapSimpleInit<S>
    ? ValidateResolve<
        S,
        {
          [K in keyof S["shape"]]: UnwrapReference<
            S,
            K
          > extends infer ChildSchema
            ? ChildSchema extends AnyCoMapSchema
              ? I[K] extends CoMap<ChildSchema, infer R>
                ? R
                : I[K] extends CoMapSimpleInit<ChildSchema>
                  ? CoMapInitToRelationsToResolve<
                      ChildSchema,
                      I[K],
                      [0, ...CurrentDepth]
                    >
                  : "1"
              : "2"
            : "3";
        } & (S["record"] extends undefined
          ? unknown
          : {
              [K in CoMapRecordKey<S>]: UnwrapRecordReference<S> extends infer ChildSchema
                ? ChildSchema extends AnyCoMapSchema
                  ? I[K] extends CoMap<ChildSchema, infer R>
                    ? R
                    : I[K] extends CoMapSimpleInit<ChildSchema>
                      ? CoMapInitToRelationsToResolve<
                          ChildSchema,
                          I[K],
                          [0, ...CurrentDepth]
                        >
                      : "1"
                  : "2"
                : "3";
            }),
        true
      >
    : true;

export type CoMapSchemaDefinition<
  S extends CoMapSchemaShape,
  R extends CoMapRecordDef | undefined = CoMapRecordDef | undefined,
  O extends boolean = boolean,
> = {
  shape: S;
  record: R;
  isOptional: O;
};

export type AnyCoMapSchema =
  | CoMapSchema<any, undefined>
  | CoMapSchema<any, CoMapRecordDef>
  | CoMapSchema<any, undefined | CoMapRecordDef>;
export type AnyCoMapSchemaDefinition =
  | CoMapSchemaDefinition<any, undefined>
  | CoMapSchemaDefinition<any, CoMapRecordDef>
  | CoMapSchemaDefinition<any, undefined | CoMapRecordDef>;

export class CoMapSchema<
  S extends CoMapSchemaShape,
  R extends CoMapRecordDef | undefined = CoMapRecordDef | undefined,
  O extends boolean = boolean,
> {
  shape: S;
  record: R;
  isOptional: O;

  constructor(schema: S, record: R, isOptional: O) {
    this.shape = schema;
    this.record = record;
    this.isOptional = isOptional;
  }

  optional() {
    return new CoMapSchema(this.shape, this.record, true);
  }

  get(key: CoMapSchemaKey<CoMapSchemaDefinition<S, R>>) {
    if (this.shape[key]) {
      return this.shape[key];
    }

    if (this.record) {
      if (this.record.key.safeParse(key).success) {
        return this.record.value;
      }
    }

    return undefined;
  }

  catchall<T extends CoMapField>(type: T) {
    const record = {
      key: z.string(),
      value: type,
    };

    return new CoMapSchema(this.shape, record, this.isOptional);
  }

  keys() {
    return Object.keys(this.shape) as (keyof S & string)[];
  }

  create<I>(
    init: R extends undefined
      ? CoMapInitStrict<CoMapSchema<S, undefined, false>, I>
      : I,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ): Loaded<
    CoMapSchemaDefinition<S, R, false>,
    CoMapInitToRelationsToResolve<CoMapSchemaDefinition<S, R>, I>,
    "non-nullable" // We want the loaded type to reflect the init input as we know for sure if values are available or not
  > {
    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return createCoMap(this, init as any, owner, uniqueness) as any;
  }
}
