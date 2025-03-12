import { TypeOf, ZodTypeAny } from "zod";
import { CoMap } from "../coMap/instance.js";
import {
  CoMapSchema,
  CoMapSchemaShape,
  CoValueSchema,
  UnwrapReference,
} from "../coMap/schema.js";

export const SelfReference = "SelfReference" as const;
export type SelfReference = typeof SelfReference;

type DEPTH_LIMIT = 5;

export type IsDepthLimit<CurrentDepth extends number[]> =
  DEPTH_LIMIT extends CurrentDepth["length"] ? true : false;

export type RelationsToResolveStrict<
  T extends CoValueSchema<any>,
  V,
> = V extends RelationsToResolve<T> ? RelationsToResolve<T> : V;

export type RelationsToResolve<
  D extends CoValueSchema<any>,
  CurrentDepth extends number[] = [],
> =
  | true
  | (IsDepthLimit<CurrentDepth> extends true
      ? true
      : D extends CoMapSchema<any>
        ?
            | {
                [K in keyof D["shape"]]?: UnwrapReference<
                  D,
                  K
                > extends CoValueSchema<any>
                  ? RelationsToResolve<
                      UnwrapReference<D, K>,
                      [0, ...CurrentDepth]
                    >
                  : never;
              }
            | true
        : true);

export type isResolveLeaf<Depth> = Depth extends boolean | undefined
  ? true
  : keyof Depth extends never // Depth = {}
    ? true
    : false;

export type Loaded<
  D extends CoValueSchema<any>,
  Depth extends RelationsToResolve<D> = true,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = Depth extends never
  ? never
  : D extends CoMapSchema<any>
    ? LoadedCoMap<D, Depth, Options, CurrentDepth>
    : never;

export type LoadedCoMap<
  D extends CoMapSchema<any>,
  Depth extends RelationsToResolve<D>,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = CoMap<D, Depth> &
  (D extends CoMapSchema<any>
    ? {
        [K in keyof D["shape"]]: D["shape"][K] extends ZodTypeAny
          ? TypeOf<D["shape"][K]>
          : UnwrapReference<D, K> extends CoValueSchema<any>
            ? Depth[K] extends RelationsToResolve<UnwrapReference<D, K>>
              ? IsDepthLimit<CurrentDepth> & isResolveLeaf<Depth> extends false
                ?
                    | Loaded<
                        UnwrapReference<D, K>,
                        Depth[K],
                        Options,
                        [0, ...CurrentDepth]
                      >
                    | addNullable<Options>
                : null
              : null
            : UnwrapZodType<D["shape"][K]>;
      }
    : never);

export type UnwrapZodType<T, O = null> = T extends ZodTypeAny ? TypeOf<T> : O;

export type ValidateResolve<
  D extends CoValueSchema<any>,
  I,
  E,
> = I extends RelationsToResolve<D> ? I : E;

export type addNullable<O extends "nullable" | "non-nullable"> =
  O extends "nullable" ? null : never;
