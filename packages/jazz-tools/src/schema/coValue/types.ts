import { TypeOf, ZodTypeAny } from "zod";
import { CoMap } from "../coMap/instance.js";
import {
  AnyCoMapSchema,
  CoMapFieldType,
  CoMapRecordFieldType,
  CoMapRecordKey,
  CoMapSchemaRelationsKeys,
  CoMapSchemaToClass,
  CoValueSchema,
  UnwrapRecordReference,
  UnwrapReference,
} from "../coMap/schema.js";
import { IsDepthLimit, flatten, simplifyResolveQuery } from "./typeUtils.js";

export type ResolveQueryStrict<
  T extends CoValueSchema,
  V,
> = V extends ResolveQuery<T> ? ResolveQuery<T> : V;

export type ResolveQuery<
  S extends CoValueSchema,
  CurrentDepth extends number[] = [],
> =
  | true
  | (IsDepthLimit<CurrentDepth> extends true
      ? true
      : S extends AnyCoMapSchema
        ? simplifyResolveQuery<
            {
              [K in CoMapSchemaRelationsKeys<S>]?: UnwrapReference<
                S,
                K
              > extends CoValueSchema
                ? ResolveQuery<UnwrapReference<S, K>, [0, ...CurrentDepth]>
                : never;
            } & (S["record"] extends undefined
              ? unknown
              : {
                  [K in CoMapRecordKey<S>]?: UnwrapRecordReference<S> extends CoValueSchema
                    ? ResolveQuery<
                        UnwrapRecordReference<S>,
                        [0, ...CurrentDepth]
                      >
                    : never;
                })
          >
        : true);

export type isQueryLeafNode<R> = R extends boolean | undefined
  ? true
  : keyof R extends never // R = {}
    ? true
    : false;

export type Loaded<
  S extends CoValueSchema,
  R = true,
  Options extends "nullable" | "non-nullable" = "nullable",
  CurrentDepth extends number[] = [],
> = R extends never
  ? never
  : S extends AnyCoMapSchema
    ? LoadedCoMap<CoMapSchemaToClass<S>, R, Options, CurrentDepth>
    : never;

export type LoadedCoMap<
  S extends AnyCoMapSchema,
  R,
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
                ? R[K] extends ResolveQuery<ChildSchema>
                  ? IsDepthLimit<CurrentDepth> &
                      isQueryLeafNode<R> extends false
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
                    ? R[K] extends ResolveQuery<ChildSchema>
                      ? IsDepthLimit<CurrentDepth> &
                          isQueryLeafNode<R> extends false
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
    (R extends ResolveQuery<S> ? CoMap<S, R> : unknown)
>;

export type UnwrapZodType<T, O> = T extends ZodTypeAny ? TypeOf<T> : O;

export type ValidateQuery<
  D extends CoValueSchema,
  I,
> = I extends ResolveQuery<D> ? simplifyResolveQuery<I> : true;

export type addNullable<
  O extends "nullable" | "non-nullable",
  T,
> = O extends "nullable"
  ? T extends { isOptional: true }
    ? null | undefined
    : never
  : never;
