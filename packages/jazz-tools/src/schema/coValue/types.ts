import { TypeOf, ZodTypeAny } from "zod";
import { CoMap } from "../coMap/instance.js";
import {
  CoMapSchema,
  CoValueSchema,
  UnwrapReference,
} from "../coMap/schema.js";
import { Optional } from "./optional.js";
import { IsDepthLimit, flatten } from "./typeUtils.js";

export type RelationsToResolveStrict<
  T extends CoValueSchema<any>,
  V,
> = V extends RelationsToResolve<T> ? RelationsToResolve<T> : V;

export type RelationsToResolve<
  S extends CoValueSchema<any>,
  CurrentDepth extends number[] = [],
> =
  | true
  | (IsDepthLimit<CurrentDepth> extends true
      ? true
      : S extends CoMapSchema<any>
        ?
            | {
                [K in keyof S["shape"]]?: UnwrapReference<
                  S,
                  K
                > extends CoValueSchema<any>
                  ? RelationsToResolve<
                      UnwrapReference<S, K>,
                      [0, ...CurrentDepth]
                    >
                  : never;
              }
            | true
        : true);

export type isResolveLeaf<R> = R extends boolean | undefined
  ? true
  : keyof R extends never // R = {}
    ? true
    : false;

export type Loaded<
  S extends CoValueSchema<any>,
  R extends RelationsToResolve<S> = true,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = R extends never
  ? never
  : S extends CoMapSchema<any>
    ? LoadedCoMap<S, R, Options, CurrentDepth>
    : never;

export type LoadedCoMap<
  S extends CoMapSchema<any>,
  R extends RelationsToResolve<S>,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = flatten<
  (S extends CoMapSchema<any>
    ? {
        [K in keyof S["shape"]]: S["shape"][K] extends ZodTypeAny
          ? TypeOf<S["shape"][K]>
          : UnwrapReference<S, K> extends CoValueSchema<any>
            ? R[K] extends RelationsToResolve<UnwrapReference<S, K>>
              ? IsDepthLimit<CurrentDepth> & isResolveLeaf<R> extends false
                ?
                    | Loaded<
                        UnwrapReference<S, K>,
                        R[K],
                        Options,
                        [0, ...CurrentDepth]
                      >
                    | addNullable<Options>
                : null
              : null
            : UnwrapZodType<S["shape"][K]>;
      }
    : never) &
    CoMap<S, R>
>;

export type UnwrapZodType<T, O = null> = T extends ZodTypeAny ? TypeOf<T> : O;

export type ValidateResolve<
  D extends CoValueSchema<any>,
  I,
  E,
> = I extends RelationsToResolve<D> ? I : E;

export type addNullable<O extends "nullable" | "non-nullable"> =
  O extends "nullable" ? null : never;
