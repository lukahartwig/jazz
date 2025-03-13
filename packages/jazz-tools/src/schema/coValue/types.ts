import { TypeOf, ZodTypeAny } from "zod";
import { CoMap } from "../coMap/instance.js";
import {
  AnyCoMapSchema,
  CoMapFieldType,
  CoMapRecordFieldType,
  CoMapRecordKey,
  CoMapSchema,
  CoValueSchema,
  CoValueSchemaDefinition,
  UnwrapRecordReference,
  UnwrapReference,
} from "../coMap/schema.js";
import { IsDepthLimit, flatten } from "./typeUtils.js";

export type RelationsToResolveStrict<
  T extends CoValueSchema,
  V,
> = V extends RelationsToResolve<T> ? RelationsToResolve<T> : V;

export type RelationsToResolve<
  S extends CoValueSchemaDefinition,
  CurrentDepth extends number[] = [],
> =
  | true
  | (IsDepthLimit<CurrentDepth> extends true
      ? true
      : S extends AnyCoMapSchema
        ? {
            [K in keyof S["shape"]]?: UnwrapReference<
              S,
              K
            > extends CoValueSchema
              ? RelationsToResolve<UnwrapReference<S, K>, [0, ...CurrentDepth]>
              : never;
          } & {
            [K in CoMapRecordKey<S>]?: UnwrapRecordReference<S> extends CoValueSchema
              ? RelationsToResolve<
                  UnwrapRecordReference<S>,
                  [0, ...CurrentDepth]
                >
              : never;
          }
        : true);

export type isResolveLeaf<R> = R extends boolean | undefined
  ? true
  : keyof R extends never // R = {}
    ? true
    : false;

export type Loaded<
  S extends CoValueSchemaDefinition,
  R extends RelationsToResolve<S> = true,
  Options extends "nullable" | "non-nullable" = "nullable",
  CurrentDepth extends number[] = [],
> = R extends never
  ? never
  : S extends AnyCoMapSchema
    ? LoadedCoMap<S, R, Options, CurrentDepth>
    : never;

export type LoadedCoMap<
  S extends AnyCoMapSchema,
  R extends RelationsToResolve<S>,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = flatten<
  (S extends AnyCoMapSchema
    ? {
        [K in keyof S["shape"]]: CoMapFieldType<S, K> extends ZodTypeAny
          ? TypeOf<CoMapFieldType<S, K>>
          : UnwrapReference<S, K> extends infer ChildSchema
            ? ChildSchema extends AnyCoMapSchema
              ? K extends keyof R
                ? R[K] extends RelationsToResolve<ChildSchema>
                  ? IsDepthLimit<CurrentDepth> & isResolveLeaf<R> extends false
                    ?
                        | Loaded<
                            ChildSchema,
                            R[K],
                            Options,
                            [0, ...CurrentDepth]
                          >
                        | addNullable<Options, CoMapFieldType<S, K>>
                    : null
                  : null
                : null
              : null
            : UnwrapZodType<CoMapFieldType<S, K>, never>;
      } & (S["record"] extends undefined
        ? unknown
        : {
            [K in CoMapRecordKey<S>]: CoMapRecordFieldType<S> extends ZodTypeAny
              ? TypeOf<CoMapRecordFieldType<S>>
              : UnwrapRecordReference<S> extends infer ChildSchema
                ? ChildSchema extends AnyCoMapSchema
                  ? K extends keyof R
                    ? R[K] extends RelationsToResolve<ChildSchema>
                      ? IsDepthLimit<CurrentDepth> &
                          isResolveLeaf<R> extends false
                        ?
                            | Loaded<
                                ChildSchema,
                                R[K],
                                Options,
                                [0, ...CurrentDepth]
                              >
                            | addNullable<Options, CoMapFieldType<S, K>>
                        : null
                      : null
                    : null
                  : null
                : UnwrapZodType<CoMapFieldType<S, K>, never>;
          })
    : never) &
    CoMap<S, R>
>;

export type UnwrapZodType<T, O> = T extends ZodTypeAny ? TypeOf<T> : O;

export type ValidateResolve<
  D extends CoValueSchemaDefinition,
  I,
  E,
> = I extends RelationsToResolve<D> ? I : E;

export type addNullable<
  O extends "nullable" | "non-nullable",
  T,
> = O extends "nullable"
  ? T extends { isOptional: true }
    ? null | undefined
    : never
  : never;
