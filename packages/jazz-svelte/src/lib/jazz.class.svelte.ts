import type { Account, CoValue, CoValueClass, ID, RefsToResolve, RefsToResolveStrict, RegisteredAccount, Resolved } from "jazz-tools";
import { createSubscriber } from "svelte/reactivity";
import { getJazzContext } from "./jazz.svelte.js";
import { subscribeToCoValue } from "jazz-tools";

export class CoState<V extends CoValue, R extends RefsToResolve<V> = true> {
    #value: Resolved<V, R> | undefined | null = undefined;
    #subscribe: VoidFunction;
    #ctx = $derived(getJazzContext<RegisteredAccount>());
    #update: VoidFunction = () => {};
    #Schema: CoValueClass<V>;
    #options: { resolve?: RefsToResolveStrict<V, R> } | undefined;
    #id: ID<CoValue> | undefined | null;

    #unsubscribe: VoidFunction = () => {};

    constructor(
        Schema: CoValueClass<V>,
        id: ID<CoValue> | undefined | null | (() => ID<CoValue> | undefined | null),
        options?: { resolve?: RefsToResolveStrict<V, R> }
    ) {
        this.#Schema = Schema;
        this.#options = options;
        this.#id = typeof id === 'function' ? id() : id;

        this.#subscribe = createSubscriber((update) => {
            this.#update = update;
    
            // Using an effect to react to the id and ctx changes 
            $effect.pre(() => {
                this.#id =  typeof id === 'function' ? id() : id;
                   
                this.subscribeTo();
            });

            return () => {
                this.#unsubscribe();
            }
        });
    }

    subscribeTo() {
        const ctx = this.#ctx;
        const id = this.#id;

        // Reset state when dependencies change
        this.updateValue(undefined);
        this.#unsubscribe();

        if (!ctx.current || !id) return;

        const agent = "me" in ctx.current ? ctx.current.me : ctx.current.guest;

        // Setup subscription with current values
        this.#unsubscribe = subscribeToCoValue<V, R>(
            this.#Schema,
            id,
            {
                resolve: this.#options?.resolve,
                loadAs: agent,
                onUnavailable: () => {
                    this.updateValue(null);
                },
                onUnauthorized: () => {
                    this.updateValue(null);
                },
                syncResolution: true,
            },
            (value) => {
                this.updateValue(value as Resolved<V, R>);
            },
        );
    }

    updateValue(value: Resolved<V, R> | undefined | null) {
        if (value !== this.#value) {
            this.#value = value;
            this.#update();
        }
    }

    get current() {
        this.#subscribe();

        return this.#value;
    }
}

export class AccountCoState<A extends Account = RegisteredAccount, R extends RefsToResolve<A> = true> {
    #value: Resolved<A, R> | undefined | null = undefined;
    #subscribe: VoidFunction;
    #ctx = $derived(getJazzContext<A>());
    #update: VoidFunction = () => {};
    #unsubscribe: VoidFunction = () => {};
    #options: { resolve?: RefsToResolveStrict<A, R> } | undefined;

    constructor(
        options?: { resolve?: RefsToResolveStrict<A, R> }
    ) {
        this.#options = options;
        this.#subscribe = createSubscriber((update) => {
            this.#update = update;

            // Using an effect to react to the ctx changes
            $effect.pre(() => {
                this.subscribeTo();
            });

            return () => {
                this.#unsubscribe();
            }
        });
    }

    subscribeTo() {
        const ctx = this.#ctx;

        // Reset state when dependencies change
        this.updateValue(undefined);
        this.#unsubscribe();

        if (!ctx.current) return;

        if (!('me' in ctx.current)) {
            throw new Error(
                "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()"
            );
        }

        const me = ctx.current.me;

        // Setup subscription with current values
        this.#unsubscribe = subscribeToCoValue<A, R>(
            me.constructor as CoValueClass<A>,
            me.id,
            {
                resolve: this.#options?.resolve,
                loadAs: me,
                onUnavailable: () => {
                    this.updateValue(null);
                },
                onUnauthorized: () => {
                    this.updateValue(null);
                },
                syncResolution: true,
            },
            (value) => {
                this.updateValue(value as Resolved<A, R>);
            },
        );
    }

    logOut = () => {
      this.#ctx.current?.logOut();
    }

    updateValue(value: Resolved<A, R> | undefined | null) {
        if (value !== this.#value) {
            this.#value = value;
            this.#update();
        }
    }

    get current() {
        this.#subscribe();

        return this.#value;
    }
}
