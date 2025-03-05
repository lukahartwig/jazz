import { CoValueUniqueness, JsonValue, RawCoMap } from "cojson";
import { Account, CoMap, Group } from "../exports.js";
import {
  CoValue,
  CoValueClass,
  ID,
  IfCo,
  ItemsSym,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Schema,
  SchemaInit,
  UnCo,
  co,
  isRefEncoded,
  parseCoValueCreateOptions,
} from "../internal.js";
import { CoValuePrototype } from "./interfaces.js";
import { ensureCoValueLoaded } from "./subscribe.js";
export type Simplify<A> = {
  [K in keyof A]: A[K];
} extends infer B
  ? B
  : never;

export class CoMapSchema {
  declare $type: "CoMap";

  static {
    this.prototype.$type = "CoMap";
  }

  getFieldDescriptor(key: string | number | symbol) {
    const schemaDef = this as unknown as Record<
      string,
      { [SchemaInit]: Schema }
    >;

    return (schemaDef[key as string]! || schemaDef[ItemsSym])?.[
      SchemaInit
    ] as Schema;
  }

  /**
   * Create a new CoMap with the given initial values and owner.
   *
   * The owner (a Group or Account) determines access rights to the CoMap.
   *
   * The CoMap will immediately be persisted and synced to connected peers.
   *
   * @example
   * ```ts
   * const person = Person.create({
   *   name: "Alice",
   *   age: 42,
   *   pet: cat,
   * }, { owner: friendGroup });
   * ```
   *
   * @category Creation
   **/
  static create<M extends CoMapSchema>(
    this: CoMapSchemaClass<M>,
    init: Simplify<CoMapInit<M>>,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ) {
    const schema = new this();

    const { owner, uniqueness } = parseCoValueCreateOptions(options);
    return CoMapInstance.fromInit(schema, init, owner, uniqueness);
  }

  /**
   * Declare a Record-like CoMap schema, by extending `CoMap.Record(...)` and passing the value schema using `co`. Keys are always `string`.
   *
   * @example
   * ```ts
   * import { co, CoMap } from "jazz-tools";
   *
   * class ColorToFruitMap extends CoMap.Record(
   *  co.ref(Fruit)
   * ) {}
   *
   * // assume we have map: ColorToFruitMap
   * // and strawberry: Fruit
   * map["red"] = strawberry;
   * ```
   *
   * @category Declaration
   */
  static Record<Value>(value: IfCo<Value, Value>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
    class RecordLikeCoMap extends CoMapSchema {
      [ItemsSym] = value;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
    interface RecordLikeCoMap extends Record<string, Value> {}

    return RecordLikeCoMap;
  }
}

export type CoKeys<Map extends object> = Exclude<
  keyof Map & string,
  keyof CoMapSchema
>;

type ForceRequiredRef<V> = V extends co<InstanceType<
  CoMapSchemaClass<any>
> | null>
  ? NonNullable<V>
  : V extends co<CoMapSchema | undefined>
    ? CoMapInstance<NonNullable<UnCo<V>>> | null
    : V;

export type CoMapInit<Map extends object> = {
  [Key in CoKeys<Map> as undefined extends Map[Key]
    ? never
    : IfCo<Map[Key], Key>]: ForceRequiredRef<Map[Key]>;
} & {
  [Key in CoKeys<Map> as IfCo<Map[Key], Key>]?: ForceRequiredRef<Map[Key]>;
};

export class CoMapInstance<M extends CoMapSchema> extends CoValuePrototype {
  declare $raw: RawCoMap;
  declare $schema: M;
  declare $id: ID<M>;

  refs = new Map<string, CoMapInstance<any>>();
  private $lastUpdateTx: number;

  constructor(schema: M, raw: RawCoMap) {
    super();
    this.$schema = schema;
    this.$raw = raw;
    this.$lastUpdateTx = raw.totalProcessedTransactions;
    this.$id = raw.id as unknown as ID<M>;
  }

  static fromInit<M extends CoMapSchema>(
    schema: M,
    init: Simplify<CoMapInit<M>> | undefined,
    owner: Account | Group,
    uniqueness?: CoValueUniqueness,
  ) {
    const { raw, refs } = createCoMapFromInit(init, owner, schema, uniqueness);

    return CoMapInstance.fromRaw(schema, raw, refs);
  }

  static fromRaw<M extends CoMapSchema>(
    schema: M,
    raw: RawCoMap,
    refs?: Map<string, CoMapInstance<any> | undefined>,
  ) {
    const instance = Object.create(new CoMapInstance(schema, raw));

    const isRecord = schema.getFieldDescriptor(ItemsSym) !== undefined;
    const fields = isRecord ? raw.keys() : Object.keys(schema);

    for (const key of fields) {
      Object.defineProperty(instance, key, {
        value: getValue(raw, schema, key),
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

    return instance as CoMapInstance<M> & Simplify<CoMapInit<M>>;
  }

  _fillRef<K extends CoKeys<M>>(key: K, value: CoMapInstance<any>) {
    const descriptor = this.$schema.getFieldDescriptor(key);

    if (descriptor && isRefEncoded(descriptor)) {
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

  $set<K extends CoKeys<M>>(key: K, value: M[K]) {
    setValue(this.$raw, this.$schema, key, value as JsonValue);
  }

  $updated(refs?: Map<string, CoMapInstance<any> | undefined>) {
    if (this.$lastUpdateTx === this.$raw.totalProcessedTransactions && !refs) {
      return this;
    }

    return CoMapInstance.fromRaw(this.$schema, this.$raw, refs ?? this.refs);
  }

  /**
   * Given an already loaded `CoMap`, ensure that the specified fields are loaded to the specified depth.
   *
   * Works like `CoMap.load()`, but you don't need to pass the ID or the account to load as again.
   *
   * @category Subscription & Loading
   */
  $resolve<const R extends RefsToResolve<M>>(
    this: CoMapInstance<M>,
    options: { resolve: RefsToResolveStrict<M, R> },
  ): Promise<Resolved<M, R>> {
    // @ts-expect-error
    return ensureCoValueLoaded(this, { resolve: options.resolve });
  }

  /**
   * Wait for the `CoMap` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  $waitForSync(options?: { timeout?: number }) {
    return this.$raw.core.waitForSync(options);
  }
}

export interface CoMapSchemaClass<S extends CoMapSchema> {
  /** @ignore */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): S;
}

function getValue(raw: RawCoMap, schema: CoMapSchema, key: string) {
  const descriptor = schema.getFieldDescriptor(key);

  if (descriptor && typeof key === "string") {
    const value = raw.get(key);

    if (descriptor === "json") {
      return value;
    } else if ("encoded" in descriptor) {
      return value === undefined ? undefined : descriptor.encoded.decode(value);
    } else if (isRefEncoded(descriptor)) {
      if (value === undefined) {
        return undefined;
      } else {
        return null;
      }
    }
  } else {
    return undefined;
  }
}

function setValue(
  raw: RawCoMap,
  schema: CoMapSchema,
  key: string,
  value: JsonValue,
) {
  const descriptor = schema.getFieldDescriptor(key);

  if (descriptor && typeof key === "string") {
    if (descriptor === "json") {
      raw.set(key, value);
    } else if ("encoded" in descriptor) {
      raw.set(key, descriptor.encoded.encode(value));
    } else if (isRefEncoded(descriptor)) {
      if (value === null) {
        if (descriptor.optional) {
          raw.set(key, null);
        } else {
          throw new Error(`Cannot set required reference ${key} to null`);
        }
      } else {
        raw.set(key, (value as unknown as CoValue).id);
      }
    }
    return true;
  }
}

function createCoMapFromInit<M extends CoMapSchema>(
  init: Simplify<CoMapInit<M>> | undefined,
  owner: Account | Group,
  schema: M,
  uniqueness?: CoValueUniqueness,
) {
  const rawOwner = owner._raw;

  const rawInit = {} as {
    [key in keyof CoKeys<M>]: JsonValue | undefined;
  };

  const refs = new Map<string, CoMapInstance<any>>();

  if (init) {
    const fields = Object.keys(init) as (keyof CoKeys<M>)[];

    for (const key of fields) {
      const initValue = init[key as keyof typeof init];

      const descriptor = schema.getFieldDescriptor(key);

      if (!descriptor) {
        continue;
      }

      if (descriptor === "json") {
        rawInit[key] = initValue as JsonValue;
      } else if (isRefEncoded(descriptor)) {
        if (initValue) {
          rawInit[key] = (initValue as unknown as CoMapInstance<any>).$id;
          refs.set(key as string, initValue as unknown as CoMapInstance<any>);
        }
      } else if ("encoded" in descriptor) {
        rawInit[key] = descriptor.encoded.encode(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initValue as any,
        );
      }
    }
  }

  const raw = rawOwner.createMap(rawInit, null, "private", uniqueness);

  return { raw, refs };
}
