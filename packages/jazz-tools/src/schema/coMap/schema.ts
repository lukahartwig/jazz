import { CoValueUniqueness } from "cojson";
import { TypeOf, ZodTypeAny, z } from "zod";
import { Account } from "../../coValues/account.js";
import { Group } from "../../coValues/group.js";
import { parseCoValueCreateOptions } from "../../internal.js";
import {
  IsDepthLimit,
  Loaded,
  LoadedCoMap,
  SelfReference,
  UnwrapZodType,
  ValidateResolve,
} from "../coValue/types.js";
import { createCoMap } from "./instance.js";

export type CoMapSchemaShape = {
  [key: string]: CoMapSchema<any> | ZodTypeAny | SelfReference;
};

export type CoValueSchema<S extends CoMapSchemaShape> = CoMapSchema<S>;

export type UnwrapReference<
  D extends CoMapSchema<any>,
  K extends keyof D["shape"],
> = D["shape"][K] extends CoValueSchema<any>
  ? D["shape"][K]
  : D["shape"][K] extends SelfReference
    ? D
    : never;

export type CoMapInit<D extends CoMapSchema<any>> = {
  [K in keyof D["shape"]]: UnwrapReference<D, K> extends CoMapSchema<any>
    ?
        | CoMapInit<UnwrapReference<D, K>>
        | LoadedCoMap<UnwrapReference<D, K>, any>
        | undefined
    : UnwrapZodType<D["shape"][K]>;
};

export type CoMapInitStrict<
  D extends CoMapSchema<any>,
  I,
> = I extends CoMapInit<D> ? CoMapInit<D> : I;

export type CoMapInitToRelationsToResolve<
  S extends CoMapSchemaShape,
  I extends CoMapInit<CoMapSchema<S>>,
  CurrentDepth extends number[] = [],
> = IsDepthLimit<CurrentDepth> extends true
  ? true
  : ValidateResolve<
      CoMapSchema<S>,
      {
        [K in keyof S]: UnwrapReference<CoMapSchema<S>, K> extends CoMapSchema<
          infer ChildSchema
        >
          ? I[K] extends LoadedCoMap<CoMapSchema<ChildSchema>, infer R>
            ? R
            : I[K] extends CoMapInit<CoMapSchema<ChildSchema>>
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
  optional = true;

  constructor(schema: S) {
    this.shape = schema;
  }

  get(key: keyof S) {
    return this.shape[key];
  }

  keys() {
    return Object.keys(this.shape) as (keyof S)[];
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
  ): Loaded<CoMapSchema<S>, CoMapInitToRelationsToResolve<S, I>> {
    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return createCoMap<CoMapSchema<S>>(this, init, owner, uniqueness) as any;
  }
}
