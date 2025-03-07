import { CoValueUniqueness, JsonValue, RawAccount, RawCoMap } from "cojson";
import { RegisteredSchemas } from "../coValues/registeredSchemas.js";
import { Account, Group } from "../exports.js";
import { AnonymousJazzAgent, ID } from "../internal.js";
import { coValuesCache } from "../lib/cache.js";
import {
  CoMap,
  CoMapInit,
  CoMapSchema,
  Loaded,
  RelationsKeys,
  RelationsToResolve,
  RelationsToResolveStrict,
  isRelationRef,
} from "./schema.js";
import { CoValueResolutionNode, ensureCoValueLoaded } from "./subscribe.js";

export type CoMapInstance<
  D extends CoMap<any>,
  R extends RelationsToResolve<D>,
> = CoMapInstanceClass<D, R> & Loaded<D, R>;

export class CoMapInstanceClass<
  D extends CoMap<any>,
  R extends RelationsToResolve<D> = true,
> {
  declare $raw: RawCoMap;
  declare $schema: D;
  declare $id: ID<D>;
  declare $resolutionNode: CoValueResolutionNode<D, R> | undefined;
  refs = new Map<RelationsKeys<D>, CoMapInstance<any, any> | undefined>();
  protected $lastUpdateTx: number;

  constructor(
    schema: D,
    raw: RawCoMap,
    resolutionNode?: CoValueResolutionNode<D, R>,
  ) {
    this.$schema = schema;
    this.$raw = raw;
    this.$lastUpdateTx = raw.totalProcessedTransactions;
    this.$id = raw.id as unknown as ID<D>;
    this.$resolutionNode = resolutionNode;
  }

  static fromInit<D extends CoMap<any>>(
    schema: D,
    init: CoMapInit<D>,
    owner: Account | Group,
    uniqueness?: CoValueUniqueness,
  ) {
    const { raw, refs } = createCoMapFromInit(init, owner, schema, uniqueness);

    return CoMapInstanceClass.fromRaw(schema, raw, refs);
  }

  static fromRaw<D extends CoMap<any>, R extends RelationsToResolve<D> = true>(
    schema: D,
    raw: RawCoMap,
    refs?: Map<RelationsKeys<D>, CoMapInstance<any, any> | undefined>,
    resolutionNode?: CoValueResolutionNode<D, R>,
  ) {
    const instance = Object.create(
      new CoMapInstanceClass(schema, raw, resolutionNode),
    );

    const isRecord = false;
    const fields = isRecord ? raw.keys() : schema.keys();

    for (const key of fields) {
      Object.defineProperty(instance, key, {
        value: getValue(raw, schema, key as keyof CoMapSchema<D>),
        writable: false,
        enumerable: true,
        configurable: true,
      });
    }

    if (refs) {
      for (const [key, value] of refs.entries()) {
        if (value) {
          instance._fillRef(key as any, value);
        }
      }
    }

    return instance as CoMapInstance<D, R>;
  }

  _fillRef<K extends RelationsKeys<D>>(key: K, value: CoMapInstance<any, any>) {
    const descriptor = this.$schema.get(key);

    if (descriptor && isRelationRef(descriptor)) {
      this.refs.set(key, value);
      Object.defineProperty(this, key, {
        value,
        writable: false,
        enumerable: true,
        configurable: true,
      });
    } else {
      throw new Error(`Field ${key} is not a reference`);
    }
  }

  $set<K extends keyof D>(key: K, value: D[K]) {
    setValue(this.$raw, this.$schema, key, value as JsonValue);
  }

  $updated(
    refs?: Map<RelationsKeys<D>, CoMapInstance<any, any> | undefined>,
  ): CoMapInstance<D, R> {
    if (this.$lastUpdateTx === this.$raw.totalProcessedTransactions && !refs) {
      return this as CoMapInstance<D, R>;
    }

    return CoMapInstanceClass.fromRaw<D, R>(
      this.$schema,
      this.$raw,
      refs ?? this.refs,
      this.$resolutionNode,
    );
  }

  /**
   * Given an already loaded `CoMap`, ensure that the specified fields are loaded to the specified depth.
   *
   * Works like `CoMap.load()`, but you don't need to pass the ID or the account to load as again.
   *
   * @category Subscription & Loading
   */
  $resolve<R extends RelationsToResolve<D>>(options: {
    resolve: RelationsToResolveStrict<D, R>;
  }): Promise<Loaded<D, R>> {
    return ensureCoValueLoaded<D, R>(
      this as unknown as CoMapInstance<D, true>,
      { resolve: options.resolve },
    );
  }

  $request<I extends CoMapInstance<D, any>, R extends RelationsToResolve<D>>(
    this: I,
    options: { resolve: RelationsToResolveStrict<D, R> },
  ) {
    this.$resolutionNode?.request(options.resolve);

    // TODO Make the resolved values null | X
    return this;
  }

  /**
   * Wait for the `CoMap` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  $waitForSync(options?: { timeout?: number }) {
    return this.$raw.core.waitForSync(options);
  }

  get _loadedAs(): Account | AnonymousJazzAgent {
    const rawAccount = this.$raw.core.node.account;

    if (rawAccount instanceof RawAccount) {
      return coValuesCache.get(rawAccount, () =>
        RegisteredSchemas["Account"].fromRaw(rawAccount),
      );
    }

    return new AnonymousJazzAgent(this.$raw.core.node);
  }

  get $owner(): Account | Group {
    return coValuesCache.get(this.$raw.group, () =>
      this.$raw.group instanceof RawAccount
        ? RegisteredSchemas["Account"].fromRaw(this.$raw.group)
        : RegisteredSchemas["Group"].fromRaw(this.$raw.group),
    );
  }
}

function getValue<D extends CoMap<any>>(
  raw: RawCoMap,
  schema: D,
  key: keyof CoMapSchema<D>,
) {
  const descriptor = schema.get(key);

  if (descriptor && typeof key === "string") {
    const value = raw.get(key);

    if (descriptor instanceof CoMap || descriptor === "self") {
      if (value === undefined) {
        return undefined;
      } else {
        return null;
      }
    } else {
      return descriptor.parse(value);
    }
  } else {
    return undefined;
  }
}

function setValue<D extends CoMap<any>>(
  raw: RawCoMap,
  schema: D,
  key: keyof CoMapSchema<D>,
  value: JsonValue,
) {
  const descriptor = schema.get(key);

  if (descriptor && typeof key === "string") {
    if (isRelationRef(descriptor)) {
      if (value === null) {
        raw.set(key, null);
      } else {
        raw.set(key, (value as unknown as CoMapInstance<CoMap<{}>, true>).$id);
      }
    } else {
      raw.set(key, descriptor.parse(value));
    }

    return true;
  }
}

function createCoMapFromInit<D extends CoMap<any>>(
  init: CoMapInit<D> | undefined,
  owner: Account | Group,
  schema: D,
  uniqueness?: CoValueUniqueness,
) {
  const rawOwner = owner._raw;

  const rawInit = {} as {
    [key in keyof CoMapSchema<D>]: JsonValue | undefined;
  };

  const refs = new Map<string, CoMapInstance<any, any>>();

  if (init) {
    const fields = Object.keys(init) as (keyof CoMapSchema<D>)[];

    for (const key of fields) {
      const initValue = init[key as keyof typeof init];

      const descriptor = schema.get(key);

      if (!descriptor) {
        continue;
      }

      if (isRelationRef(descriptor)) {
        if (initValue === null) {
          rawInit[key] = null;
        } else {
          rawInit[key] = (
            initValue as unknown as CoMapInstance<CoMap<{}>, true>
          ).$id;
          refs.set(
            key as string,
            initValue as unknown as CoMapInstance<any, any>,
          );
        }
      } else {
        rawInit[key] = descriptor.parse(initValue);
      }
    }
  }

  const raw = rawOwner.createMap(rawInit, null, "private", uniqueness);

  return { raw, refs };
}
