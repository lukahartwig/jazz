import { TypeOf, ZodTypeAny } from "zod";
import { CoMap } from "../coMap/instance.js";
import { CoMapSchema, CoValueSchema } from "../coMap/schema.js";

export const SelfReference = "SelfReference" as const;
export type SelfReference = typeof SelfReference;

type DEPTH_LIMIT = 5;

export type IsDepthLimit<CurrentDepth extends number[]> =
  DEPTH_LIMIT extends CurrentDepth["length"] ? true : false;

export type CoValue<
  D extends CoValueSchema<any>,
  R extends RelationsToResolve<D>,
> = LoadedCoMap<D, R>;

export type RelationsToResolveStrict<
  T extends CoValueSchema<any>,
  V,
> = V extends RelationsToResolve<T> ? RelationsToResolve<T> : V;

export type RelationsToResolve<
  D extends CoValueSchema<any>,
  CurrentDepth extends number[] = [],
> =
  | boolean
  | (IsDepthLimit<CurrentDepth> extends true
      ? boolean
      : D extends CoMapSchema<infer S>
        ?
            | {
                [K in keyof S]?: S[K] extends CoValueSchema<any>
                  ? RelationsToResolve<S[K], [0, ...CurrentDepth]>
                  : S[K] extends SelfReference
                    ? RelationsToResolve<CoMapSchema<S>, [0, ...CurrentDepth]>
                    : never;
              }
            | boolean
        : boolean);

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
  ? D
  : D extends CoMapSchema<infer S>
    ? LoadedCoMap<CoMapSchema<S>, Depth, Options, CurrentDepth>
    : D;

export type LoadedCoMap<
  D extends CoMapSchema<any>,
  Depth extends RelationsToResolve<D>,
  Options extends "nullable" | "non-nullable" = "non-nullable",
  CurrentDepth extends number[] = [],
> = CoMap<D, Depth> &
  (D extends CoMapSchema<infer S>
    ? IsDepthLimit<CurrentDepth> & isResolveLeaf<Depth> extends true // The & here is used as OR operator
      ? {
          [K in keyof S]: UnwrapZodType<S[K]>;
        }
      : {
          [K in keyof S]: K extends keyof Depth
            ? S[K] extends CoValueSchema<any>
              ? Depth[K] extends RelationsToResolve<S[K]>
                ?
                    | Loaded<S[K], Depth[K], Options, [0, ...CurrentDepth]>
                    | addNullable<Options>
                : null
              : S[K] extends SelfReference
                ? Depth[K] extends RelationsToResolve<D>
                  ?
                      | Loaded<D, Depth[K], Options, [0, ...CurrentDepth]>
                      | addNullable<Options>
                  : null
                : UnwrapZodType<S[K]>
            : UnwrapZodType<S[K]>;
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
