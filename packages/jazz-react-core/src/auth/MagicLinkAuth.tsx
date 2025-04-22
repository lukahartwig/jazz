import {
  MagicLinkAuth,
  MagicLinkAuthAsSourceOptions,
  MagicLinkAuthAsTargetOptions,
  MagicLinkAuthCreateAsSource,
  MagicLinkAuthCreateAsTarget,
  MagicLinkAuthHandleAsSource,
  MagicLinkAuthHandleAsTarget,
  MagicLinkAuthOptions,
} from "jazz-tools";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useAuthSecretStorage, useJazzContext } from "../hooks.js";

const DEFAULT_EXPIRE_IN_MS = 15 * 60 * 1000;

export type UseMagicLinkAuthAsSourceOptions = MagicLinkAuthOptions &
  MagicLinkAuthAsSourceOptions;

export type UseMagicLinkAuthAsTargetOptions = MagicLinkAuthOptions &
  MagicLinkAuthAsTargetOptions;

export function useCreateMagicLinkAuthAsSource(
  origin: string,
  {
    expireInMs = DEFAULT_EXPIRE_IN_MS,
    ...options
  }: Partial<UseMagicLinkAuthAsSourceOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuthCreateAsSource(
      new MagicLinkAuth(
        context.node.crypto,
        context.authenticate,
        authSecretStorage,
        origin,
        options,
      ),
    );
  }, [origin]);

  const authState = useSyncExternalStore(
    useCallback(magicLinkAuth.subscribe, [magicLinkAuth]),
    () => magicLinkAuth.authState,
  );

  if ("guest" in context) {
    throw new Error("Magic Link Auth is not supported in guest mode");
  }

  return {
    ...authState,
    createLink: () => magicLinkAuth.createLink(),
    cancelFlow: () => magicLinkAuth.cancelFlow(),
  } as const;
}

export function useCreateMagicLinkAuthAsTarget(
  origin: string,
  {
    handlerTimeout = 30 * 1000,
    onLoggedIn,
    ...options
  }: Partial<UseMagicLinkAuthAsTargetOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuthCreateAsTarget(
      new MagicLinkAuth(
        context.node.crypto,
        context.authenticate,
        authSecretStorage,
        origin,
        options,
      ),
      { handlerTimeout, onLoggedIn },
    );
  }, [origin]);

  const authState = useSyncExternalStore(
    useCallback(magicLinkAuth.subscribe, [magicLinkAuth]),
    () => magicLinkAuth.authState,
  );

  if ("guest" in context) {
    throw new Error("Magic Link Auth is not supported in guest mode");
  }

  return {
    ...authState,
    createLink: () => magicLinkAuth.createLink(),
    cancelFlow: () => magicLinkAuth.cancelFlow(),
  } as const;
}

export function useHandleMagicLinkAuthAsTarget(
  origin: string,
  url: string,
  {
    handlerTimeout = 30 * 1000,
    onLoggedIn,
    ...options
  }: Partial<UseMagicLinkAuthAsTargetOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const urlRef = useRef<string | undefined>();

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuthHandleAsTarget(
      new MagicLinkAuth(
        context.node.crypto,
        context.authenticate,
        authSecretStorage,
        origin,
        options,
      ),
      { handlerTimeout, onLoggedIn },
    );
  }, [origin]);

  const authState = useSyncExternalStore(
    useCallback(magicLinkAuth.subscribe, [magicLinkAuth]),
    () => magicLinkAuth.authState,
  );

  useEffect(() => {
    if (!magicLinkAuth.checkValidUrl(url)) return;

    if (urlRef.current === url) return;
    urlRef.current = url;

    magicLinkAuth.handleFlow(url);

    return () => {
      magicLinkAuth.cancelFlow();
    };
  }, [url]);

  return {
    ...authState,
    cancelFlow: () => magicLinkAuth.cancelFlow(),
  } as const;
}

export function useHandleMagicLinkAuthAsSource(
  origin: string,
  url: string,
  {
    expireInMs = DEFAULT_EXPIRE_IN_MS,
    ...options
  }: Partial<UseMagicLinkAuthAsSourceOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const urlRef = useRef<string | undefined>();

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuthHandleAsSource(
      new MagicLinkAuth(
        context.node.crypto,
        context.authenticate,
        authSecretStorage,
        origin,
        options,
      ),
      { expireInMs },
    );
  }, [origin]);

  const authState = useSyncExternalStore(
    useCallback(magicLinkAuth.subscribe, [magicLinkAuth]),
    () => magicLinkAuth.authState,
  );

  useEffect(() => {
    if (!magicLinkAuth.checkValidUrl(url)) return;

    if (urlRef.current === url) return;
    urlRef.current = url;

    magicLinkAuth.handleFlow(url);

    return () => {
      magicLinkAuth.cancelFlow();
    };
  }, [url]);

  return {
    ...authState,
    cancelFlow: () => magicLinkAuth.cancelFlow(),
  } as const;
}
