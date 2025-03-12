import { consumeInviteLinkFromWindowLocation } from "jazz-browser";
import {
  Account,
  AnonymousJazzAgent,
  AuthSecretStorage,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
  JazzAuthContext,
  JazzContextType,
  JazzGuestContext,
  subscribeToCoValue,
} from "jazz-tools";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ComputedRef,
  MaybeRef,
  Ref,
  ShallowRef,
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  toRaw,
  unref,
  watch,
} from "vue";
import {
  JazzAuthContextSymbol,
  JazzContextSymbol,
  RegisteredAccount,
} from "./provider.js";

export const logoutHandler = ref<() => void>();

export function useJazzContext() {
  const context =
    inject<Ref<JazzContextType<RegisteredAccount>>>(JazzContextSymbol);
  if (!context?.value) {
    throw new Error("useJazzContext must be used within a JazzProvider");
  }
  return context;
}

export function useAuthSecretStorage() {
  const context = inject<AuthSecretStorage>(JazzAuthContextSymbol);
  if (!context) {
    throw new Error("useAuthSecretStorage must be used within a JazzProvider");
  }
  return context;
}

export function createUseAccountComposables<Acc extends Account>() {
  function useAccount(): {
    me: ComputedRef<Acc>;
    logOut: () => void;
  };
  function useAccount<D extends DepthsIn<Acc>>(
    depth: D,
  ): {
    me: ComputedRef<DeeplyLoaded<Acc, D> | undefined | null>;
    logOut: () => void;
  };
  function useAccount<D extends DepthsIn<Acc>>(
    depth?: D,
  ): {
    me: ComputedRef<Acc | DeeplyLoaded<Acc, D> | undefined | null>;
    logOut: () => void;
  } {
    const context = useJazzContext();

    if (!context.value) {
      throw new Error("useAccount must be used within a JazzProvider");
    }

    if (!("me" in context.value)) {
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
      );
    }

    const contextMe = context.value.me as Acc;

    const me = useCoState<Acc, D>(
      contextMe.constructor as CoValueClass<Acc>,
      contextMe.id,
      depth,
    );

    return {
      me: computed(() => {
        const value =
          depth === undefined
            ? me.value || toRaw((context.value as JazzAuthContext<Acc>).me)
            : me.value;

        return value ? toRaw(value) : value;
      }),
      logOut: context.value.logOut,
    };
  }

  function useAccountOrGuest(): {
    me: ComputedRef<Acc | AnonymousJazzAgent>;
  };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: D,
  ): {
    me: ComputedRef<
      DeeplyLoaded<Acc, D> | undefined | null | AnonymousJazzAgent
    >;
  };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth?: D,
  ): {
    me: ComputedRef<
      Acc | DeeplyLoaded<Acc, D> | undefined | null | AnonymousJazzAgent
    >;
  } {
    const context = useJazzContext();

    if (!context.value) {
      throw new Error("useAccountOrGuest must be used within a JazzProvider");
    }

    const contextMe = computed(() =>
      "me" in context.value ? (context.value.me as Acc) : undefined,
    );

    const me = useCoState<Acc, D>(
      contextMe.value?.constructor as CoValueClass<Acc>,
      contextMe.value?.id,
      depth,
    );

    if ("me" in context.value) {
      return {
        me: computed(() =>
          depth === undefined
            ? me.value || toRaw((context.value as JazzAuthContext<Acc>).me)
            : me.value,
        ),
      };
    } else {
      return {
        me: computed(() => toRaw((context.value as JazzGuestContext).guest)),
      };
    }
  }

  return {
    useAccount,
    useAccountOrGuest,
  };
}

const { useAccount, useAccountOrGuest } =
  createUseAccountComposables<RegisteredAccount>();

export { useAccount, useAccountOrGuest };

export function useCoState<V extends CoValue, D>(
  Schema: CoValueClass<V>,
  id: MaybeRef<ID<CoValue> | undefined>,
  depth: D & DepthsIn<V> = [] as D & DepthsIn<V>,
): Ref<DeeplyLoaded<V, D> | undefined | null> {
  const state: ShallowRef<DeeplyLoaded<V, D> | undefined | null> =
    shallowRef(undefined);
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useCoState must be used within a JazzProvider");
  }

  let unsubscribe: (() => void) | undefined;

  watch(
    [() => unref(id), () => context, () => Schema, () => depth],
    () => {
      if (unsubscribe) unsubscribe();

      const idValue = unref(id);
      if (!idValue) return;

      unsubscribe = subscribeToCoValue(
        Schema,
        idValue,
        "me" in context.value
          ? toRaw(context.value.me)
          : toRaw(context.value.guest),
        depth,
        (value) => {
          state.value = value;
        },
        () => {
          state.value = null;
        },
        true,
      );
    },
    { deep: true, immediate: true },
  );

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  const computedState = computed(() => state.value);

  return computedState;
}

export function useAcceptInvite<V extends CoValue>({
  invitedObjectSchema,
  onAccept,
  forValueHint,
}: {
  invitedObjectSchema: CoValueClass<V>;
  onAccept: (projectID: ID<V>) => void;
  forValueHint?: string;
}): void {
  const context = useJazzContext();

  if (!context.value) {
    throw new Error("useAcceptInvite must be used within a JazzProvider");
  }

  if (!("me" in context.value)) {
    throw new Error(
      "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.",
    );
  }

  const runInviteAcceptance = () => {
    const result = consumeInviteLinkFromWindowLocation({
      as: toRaw((context.value as JazzAuthContext<RegisteredAccount>).me),
      invitedObjectSchema,
      forValueHint,
    });

    result
      .then((res) => res && onAccept(res.valueID))
      .catch((e) => {
        console.error("Failed to accept invite", e);
      });
  };

  onMounted(() => {
    runInviteAcceptance();
  });

  watch(
    () => onAccept,
    (newOnAccept, oldOnAccept) => {
      if (newOnAccept !== oldOnAccept) {
        runInviteAcceptance();
      }
    },
  );
}
