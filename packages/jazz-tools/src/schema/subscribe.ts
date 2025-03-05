import { LocalNode, RawCoMap } from "cojson";
import { cojsonInternals } from "cojson";
import { Account } from "../exports.js";
import { activeAccountContext } from "../implementation/activeAccountContext.js";
import {
  AnonymousJazzAgent,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SchemaInit,
  isRefEncoded,
} from "../internal.js";
import { CoMapInstance, CoMapSchema, CoMapSchemaClass } from "./coMap.js";

type SubscribeListener<S extends CoMapSchema, R extends RefsToResolve<S>> = (
  value: Resolved<S, R>,
  unsubscribe: () => void,
) => void;

function createResolvablePromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

type ResolvablePromise<T> = ReturnType<typeof createResolvablePromise<T>>;

class Subscription {
  _unsubscribe: () => void = () => {};
  unsubscribed = false;

  value: RawCoMap | undefined;
  status: "unknown" | "loading" | "loaded" | "unauthorized" | "unavailable" =
    "unknown";

  constructor(
    public node: LocalNode,
    public id: ID<CoMapSchema>,
    public listener: (value: RawCoMap) => void,
  ) {
    const value = this.node.coValuesStore.get(this.id as any);

    if (value.state.type === "available") {
      this.status = "loaded";
      this.subscribe(value.state.coValue.getCurrentContent() as RawCoMap);
    } else {
      this.status = "loading";
      this.node.load(this.id as any).then((value) => {
        if (this.unsubscribed) return;
        // TODO handle the error states which should be transitive
        if (value !== "unavailable") {
          this.status = "loaded";
          this.subscribe(value as RawCoMap);
        } else {
          this.status = "unavailable";
        }
      });
    }
  }

  subscribe(value: RawCoMap) {
    if (this.unsubscribed) return;

    this._unsubscribe = value.subscribe((value) => {
      this.listener(value);
    });
    this.listener(value);
  }

  unsubscribe() {
    if (this.unsubscribed) return;
    this.unsubscribed = true;
    this._unsubscribe();
  }
}

export class CoValueResolutionNode<S extends CoMapSchema> {
  childNodes = new Map<string, CoValueResolutionNode<CoMapSchema>>();
  childValues = new Map<string, CoMapInstance<S> | undefined>();
  value: CoMapInstance<S> | undefined;
  status: "loading" | "loaded" | "unauthorized" | "unavailable" = "loading";
  promise: ResolvablePromise<void> | undefined;
  subscription: Subscription;
  listener: ((value: CoMapInstance<S>) => void) | undefined;

  constructor(
    public node: LocalNode,
    public resolve: RefsToResolve<S>,
    public id: ID<S>,
    public schema: S,
  ) {
    this.subscription = new Subscription(node, id, (value) => {
      this.handleUpdate(value);
    });
  }

  handleUpdate(value: RawCoMap) {
    if (!this.value) {
      this.value = CoMapInstance.fromRaw(
        this.schema,
        value,
        this.childValues,
        this,
      );
      this.loadChildren();
      if (this.isLoaded()) {
        this.listener?.(this.value);
      }
    } else if (this.isLoaded()) {
      this.value = this.value.$updated();
      this.listener?.(this.value);
    }
  }

  handleChildUpdate = (key: string, value: CoMapInstance<S>) => {
    this.childValues.set(key, value);

    if (this.value && this.isLoaded()) {
      this.value = this.value.$updated(this.childValues);
      this.listener?.(this.value);
    }
  };

  isLoaded() {
    if (!this.value) return false;

    for (const value of this.childValues.values()) {
      if (value === undefined) return false;
    }

    return true;
  }

  request(resolve: RefsToResolve<S>) {
    if (this.resolve === true || !this.resolve) {
      this.resolve = resolve;
    } else if (typeof this.resolve === "object") {
      // TODO: Better merge strategy
      // @ts-expect-error
      this.resolve = { ...this.resolve, ...resolve };
    }

    this.loadChildren();
  }

  setListener(listener: (value: CoMapInstance<S>) => void) {
    this.listener = listener;
    if (this.value && this.isLoaded()) {
      this.listener(this.value);
    }
  }

  async loadChildren() {
    const { node, resolve, schema } = this;

    const raw = this.value?.$raw;

    if (raw === undefined) {
      throw new Error("RefNode is not initialized");
    }

    if (typeof resolve === "object" && resolve !== null) {
      for (const key of Object.keys(resolve)) {
        const value = raw.get(key);
        const refDescriptor = schema.getFieldDescriptor(key);

        if (value && isRefEncoded(refDescriptor) && !this.childNodes.has(key)) {
          const childSchema = new (
            refDescriptor.ref as CoMapSchemaClass<any>
          )();

          this.childValues.set(key, undefined);
          const child = new CoValueResolutionNode(
            node,
            resolve[key],
            raw.get(key) as ID<any>,
            childSchema,
          );
          child.setListener((value) => this.handleChildUpdate(key, value));
          this.childNodes.set(key, child);
        }
      }
    }
  }
}

export function subscribeToCoValue<
  S extends CoMapSchema,
  const R extends RefsToResolve<S>,
>(
  cls: CoMapSchemaClass<S>,
  id: ID<CoMapSchema>,
  options: {
    resolve?: RefsToResolveStrict<S, R>;
    loadAs?: Account | AnonymousJazzAgent;
    onUnavailable?: () => void;
    onUnauthorized?: () => void;
  },
  listener: SubscribeListener<S, R>,
) {
  const loadAs = options.loadAs ?? activeAccountContext.get();
  const node = "node" in loadAs ? loadAs.node : loadAs._raw.core.node;

  const resolve = options.resolve ?? true;

  let unsubscribed = false;

  let schema = cls as any;

  if (typeof schema === "function") {
    schema = new cls();
  }

  const rootNode = new CoValueResolutionNode<S>(
    node,
    resolve,
    id as ID<S>,
    schema,
  );
  rootNode.setListener(handleUpdate);

  function unsubscribe() {
    unsubscribed = true;
    rootNode.subscription.unsubscribe();
  }

  function handleUpdate(value: CoMapInstance<S>) {
    if (unsubscribed) return;

    listener(value as unknown as Resolved<S, R>, unsubscribe);
  }

  return unsubscribe;
}

export function loadCoValue<S extends CoMapSchema, R extends RefsToResolve<S>>(
  cls: CoMapSchemaClass<S>,
  id: ID<CoMapSchema>,
  options?: {
    resolve?: RefsToResolveStrict<S, R>;
    loadAs?: Account | AnonymousJazzAgent;
  },
) {
  return new Promise((resolve) => {
    subscribeToCoValue<S, R>(
      cls,
      id,
      {
        resolve: options?.resolve,
        loadAs: options?.loadAs,
        onUnavailable: () => {
          resolve(undefined);
        },
        onUnauthorized: () => {
          resolve(undefined);
        },
      },
      (value, unsubscribe) => {
        resolve(value);
        unsubscribe();
      },
    );
  });
}

export async function ensureCoValueLoaded<
  V extends CoMapInstance<any>,
  const R extends RefsToResolve<V>,
>(
  existing: V,
  options?: { resolve?: RefsToResolveStrict<V, R> } | undefined,
): Promise<Resolved<V, R>> {
  const response = await loadCoValue(existing.$schema, existing.$id, {
    loadAs: existing._loadedAs,
    resolve: options?.resolve as any,
  });

  if (!response) {
    throw new Error("Failed to deeply load CoValue " + existing.id);
  }

  return response as Resolved<V, R>;
}
