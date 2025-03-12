import { CoValueUniqueness, JsonValue, RawAccount, RawCoMap } from "cojson";
import { ZodTypeAny } from "zod";
import type { Account } from "../../coValues/account.js";
import type { Group } from "../../coValues/group.js";
import { RegisteredSchemas } from "../../coValues/registeredSchemas.js";
import { AnonymousJazzAgent, ID } from "../../internal.js";
import { coValuesCache } from "../../lib/cache.js";
import { isOptional } from "../coValue/optional.js";
import { SelfReference, isSelfReference } from "../coValue/self.js";
import {
  Loaded,
  RelationsToResolve,
  RelationsToResolveStrict,
} from "../coValue/types.js";
import { CoValueResolutionNode, ensureCoValueLoaded } from "../subscribe.js";
import { CoMapInit, CoMapSchema, CoValueSchema } from "./schema.js";

type Relations<D extends CoValueSchema<any>> = D extends CoMapSchema<infer S>
  ? {
      [K in keyof S]: S[K] extends CoMapSchema<any>
        ? S[K]
        : S[K] extends SelfReference
          ? D
          : never;
    }
  : never;

type RelationsKeys<D extends CoValueSchema<any>> = keyof Relations<D> &
  (string | number);

type ChildMap<D extends CoMapSchema<any>> = Map<
  RelationsKeys<D>,
  Loaded<any, any> | undefined
>;

type PropertyType<
  D extends CoMapSchema<any>,
  K extends keyof D["shape"],
> = CoMapInit<D>[K];

export type CoMap<
  D extends CoMapSchema<any>,
  R extends RelationsToResolve<D> = true,
> = {
  $jazz: CoMapJazzApi<D, R>;
};

export class CoMapJazzApi<
  D extends CoMapSchema<any>,
  R extends RelationsToResolve<D> = true,
> {
  raw: RawCoMap;
  schema: D;
  id: ID<D>;
  _resolutionNode: CoValueResolutionNode<D, R> | undefined;
  refs: ChildMap<D> = new Map();
  protected lastUpdateTx: number;
  declare _instance: Loaded<D, R>;

  constructor(
    schema: D,
    raw: RawCoMap,
    resolutionNode?: CoValueResolutionNode<D, R>,
  ) {
    this.schema = schema;
    this.raw = raw;
    this.lastUpdateTx = raw.totalProcessedTransactions;
    this.id = raw.id as unknown as ID<D>;
    this._resolutionNode = resolutionNode;
  }

  _setInstance(instance: CoMap<D, R>) {
    this._instance = instance as unknown as Loaded<D, R>;
  }

  _fillRef<K extends RelationsKeys<D>>(key: K, value: Loaded<any, any>) {
    const descriptor = this.schema.get(key);

    if (descriptor && isRelationRef(descriptor)) {
      this.refs.set(key, value);
      Object.defineProperty(this._instance, key, {
        value,
        writable: false,
        enumerable: true,
        configurable: true,
      });
    } else {
      throw new Error(`Field ${key} is not a reference`);
    }
  }

  set<K extends keyof D["shape"]>(key: K, value: PropertyType<D, K>) {
    setValue(this.raw, this.schema, key, value as JsonValue);
  }

  updated(refs?: ChildMap<D>): Loaded<D, R> {
    if (this.lastUpdateTx === this.raw.totalProcessedTransactions && !refs) {
      return this._instance;
    }

    return createCoMapFromRaw<D, R>(
      this.schema,
      this.raw,
      refs ?? this.refs,
      this._resolutionNode,
    );
  }

  /**
   * Given an already loaded `CoMapSchema`, ensure that the specified fields are loaded to the specified depth.
   *
   * Works like `CoMapSchema.load()`, but you don't need to pass the ID or the account to load as again.
   *
   * @category Subscription & Loading
   */
  resolve<O extends RelationsToResolve<D>>(options: {
    resolve: RelationsToResolveStrict<D, O>;
  }): Promise<Loaded<D, O>> {
    return ensureCoValueLoaded<D, R, O>(this._instance, {
      resolve: options.resolve,
    });
  }

  request<R extends RelationsToResolve<D>>(options: {
    resolve: RelationsToResolveStrict<D, R>;
  }) {
    this._resolutionNode?.request(options.resolve);

    // TODO Merge with the current Resolve
    return this as Loaded<D, R, "nullable">;
  }

  /**
   * Wait for the `CoMapSchema` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: { timeout?: number }) {
    return this.raw.core.waitForSync(options);
  }

  get _loadedAs(): Account | AnonymousJazzAgent {
    const rawAccount = this.raw.core.node.account;

    if (rawAccount instanceof RawAccount) {
      return coValuesCache.get(rawAccount, () =>
        RegisteredSchemas["Account"].fromRaw(rawAccount),
      );
    }

    return new AnonymousJazzAgent(this.raw.core.node);
  }

  get owner(): Account | Group {
    return coValuesCache.get(this.raw.group, () =>
      this.raw.group instanceof RawAccount
        ? RegisteredSchemas["Account"].fromRaw(this.raw.group)
        : RegisteredSchemas["Group"].fromRaw(this.raw.group),
    );
  }
}

export function createCoMap<D extends CoMapSchema<any>>(
  schema: D,
  init: CoMapInit<D>,
  owner: Account | Group,
  uniqueness?: CoValueUniqueness,
) {
  const { raw, refs } = createCoMapFromInit(init, owner, schema, uniqueness);

  return createCoMapFromRaw<D, true>(schema, raw, refs);
}

export function createCoMapFromRaw<
  D extends CoMapSchema<any>,
  R extends RelationsToResolve<D>,
>(
  schema: D,
  raw: RawCoMap,
  refs?: ChildMap<D>,
  resolutionNode?: CoValueResolutionNode<D, R>,
) {
  const instance = Object.create({
    $jazz: new CoMapJazzApi(schema, raw, resolutionNode),
  }) as CoMap<D, R>;
  instance.$jazz._setInstance(instance);

  const isRecord = false;
  const fields = isRecord ? raw.keys() : schema.keys();

  for (const key of fields) {
    Object.defineProperty(instance, key, {
      value: getValue(raw, schema, key as keyof D["shape"]),
      writable: false,
      enumerable: true,
      configurable: true,
    });
  }

  if (refs) {
    for (const [key, value] of refs.entries()) {
      if (value) {
        instance.$jazz._fillRef(key as any, value);
      }
    }
  }

  return instance as unknown as Loaded<D, R>;
}

function getValue<D extends CoMapSchema<any>>(
  raw: RawCoMap,
  schema: D,
  key: keyof D["shape"],
) {
  const descriptor = schema.get(key);

  if (descriptor && typeof key === "string") {
    const value = raw.get(key);

    if (descriptor instanceof CoMapSchema || isSelfReference(descriptor)) {
      if (value === undefined) {
        return undefined;
      } else {
        return null;
      }
    } else {
      try {
        return descriptor.parse(value);
      } catch (error) {
        throw new Error(
          `Failed to parse field ${key}: ${JSON.stringify(error)}`,
        );
      }
    }
  } else {
    return undefined;
  }
}

function setValue<D extends CoMapSchema<any>>(
  raw: RawCoMap,
  schema: D,
  key: keyof D["shape"],
  value: JsonValue,
) {
  const descriptor = schema.get(key);

  if (descriptor && typeof key === "string") {
    if (isRelationRef(descriptor)) {
      if (value === null) {
        if (isOptional(descriptor)) {
          raw.set(key, null);
        } else {
          throw new Error(`Field ${key} is required`);
        }
      } else {
        raw.set(
          key,
          (value as unknown as Loaded<CoMapSchema<{}>, true>).$jazz.id,
        );
      }
    } else {
      // TODO: Provide better parse errors with the field information
      try {
        raw.set(key, descriptor.parse(value));
      } catch (error) {
        throw new Error(
          `Failed to parse field ${key}: ${JSON.stringify(error)}`,
        );
      }
    }

    return true;
  }
}

function createCoMapFromInit<D extends CoMapSchema<any>>(
  init: CoMapInit<D> | undefined,
  owner: Account | Group,
  schema: D,
  uniqueness?: CoValueUniqueness,
) {
  const rawOwner = owner._raw;

  const rawInit = {} as {
    [key in keyof D["shape"]]: JsonValue | undefined;
  };

  const refs = new Map<string, Loaded<any, any>>();

  if (init) {
    const fields = schema.keys() as (keyof D["shape"] & string)[];

    for (const key of fields) {
      const initValue = init[key];

      const descriptor = schema.get(key);

      if (!descriptor) {
        continue;
      }

      if (isRelationRef(descriptor)) {
        if (initValue === null || initValue === undefined) {
          if (isOptional(descriptor)) {
            rawInit[key] = null;
          } else {
            throw new Error(`Field ${key} is required`);
          }
        } else {
          let instance: Loaded<CoValueSchema<{}>>;

          if ("$jazz" in initValue) {
            instance = initValue as unknown as Loaded<CoValueSchema<{}>>;
          } else if (isSelfReference(descriptor)) {
            instance = schema.create(
              initValue as CoMapInit<any>,
              owner,
            ) as Loaded<CoValueSchema<{}>>;
          } else {
            instance = descriptor.create(
              initValue as CoMapInit<any>,
              owner,
            ) as Loaded<CoValueSchema<{}>>;
          }

          rawInit[key] = instance.$jazz.id;
          refs.set(key as string, instance);
        }
      } else {
        try {
          rawInit[key] = descriptor.parse(initValue);
        } catch (error) {
          throw new Error(
            `Failed to parse field ${key}: ${JSON.stringify(error)}`,
          );
        }
      }
    }
  }

  const raw = rawOwner.createMap(rawInit, null, "private", uniqueness);

  return { raw, refs };
}

export function isRelationRef(
  descriptor: CoMapSchema<any> | ZodTypeAny | SelfReference,
): descriptor is CoMapSchema<any> | SelfReference {
  return descriptor instanceof CoMapSchema || isSelfReference(descriptor);
}
