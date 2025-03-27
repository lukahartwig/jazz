import {
  MagicLinkAuth,
  MagicLinkAuthOptions,
  waitForCoValueCondition,
} from "jazz-tools";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSecretStorage, useJazzContext } from "../hooks.js";

export function useCreateMagicLinkAuthAsProvider(
  origin: string,
  {
    autoConfirmLogIn = false,
    ...options
  }: Partial<{ autoConfirmLogIn: boolean } & MagicLinkAuthOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const [status, setStatus] = useState<
    | "idle"
    | "waitingForConsumer"
    | "waitingForConfirmLogIn"
    | "authorized"
    | "expired"
  >("idle");
  const [confirmLogIn, setConfirmLogIn] = useState<null | (() => void)>(null);

  if ("guest" in context) {
    throw new Error("Magic Link Auth is not supported in guest mode");
  }

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuth(
      context.node.crypto,
      context.authenticate,
      authSecretStorage,
      origin,
      options,
    );
  }, [origin, options]);

  const createLink = useCallback(
    async (expireInMs?: number) => {
      expireInMs = expireInMs ?? 15 * 60 * 1000;

      let transfer = await magicLinkAuth.createTransferAsProvider(
        new Date(Date.now() + expireInMs),
      );

      const url = magicLinkAuth.createLink("consumer", transfer, "writeOnly");

      async function handleFlow() {
        try {
          // Wait for consumer to accept the transfer
          setStatus("waitingForConsumer");

          transfer = await waitForCoValueCondition(
            transfer,
            {},
            (t) => Boolean(t.acceptedBy),
            expireInMs,
          );

          if (!transfer.acceptedBy) throw new Error("Transfer not accepted");

          // Wait for confirmation if needed
          if (!autoConfirmLogIn) {
            setStatus("waitingForConfirmLogIn");
            await new Promise<void>((resolve) =>
              setConfirmLogIn(() => resolve),
            );
            setConfirmLogIn(null);
          }

          // Check if the transfer has expired
          if (transfer.expiresAt && transfer.expiresAt < new Date()) {
            setStatus("expired");
            return;
          }

          // Reveal the secret to the transfer
          await magicLinkAuth.revealSecretToTransfer(transfer);

          // Wait for the transfer to be authorized and update the status
          await waitForCoValueCondition(
            transfer,
            {},
            (t) => t.status === "authorized",
          );
          setStatus("authorized");
        } catch (error) {
          console.error("Magic Link Auth error", error);
          setConfirmLogIn(null);
        }
      }

      handleFlow();

      return url;
    },
    [magicLinkAuth, autoConfirmLogIn],
  );

  return {
    status,
    createLink,
    confirmLogIn: () => confirmLogIn?.(),
  } as const;
}

export function useCreateMagicLinkAuthAsConsumer(
  origin: string,
  options: Partial<MagicLinkAuthOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const [status, setStatus] = useState<
    "idle" | "waitingForProvider" | "authorized" | "error"
  >("idle");

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuth(
      context.node.crypto,
      context.authenticate,
      authSecretStorage,
      origin,
    );
  }, [origin, options]);

  const createLink = useCallback(async () => {
    let transfer = await magicLinkAuth.createTransferAsConsumer();

    const url = magicLinkAuth.createLink("provider", transfer, "writer");

    async function handleFlow() {
      try {
        // Wait for the provider to set the transfer secret
        setStatus("waitingForProvider");

        transfer = await waitForCoValueCondition(transfer, {}, (t) =>
          Boolean(t.secret),
        );
        if (!transfer.secret) throw new Error("Transfer secret not set");

        // Log in using the transfer secret
        await magicLinkAuth.logInViaTransfer(transfer);
        setStatus("authorized");
      } catch (error) {
        console.error("Magic Link Auth error", error);
        setStatus("error");
      }
    }

    handleFlow();

    return url;
  }, [magicLinkAuth]);

  return {
    status,
    createLink,
  } as const;
}

export function useHandleMagicLinkAuthAsConsumer(
  origin: string,
  url: string,
  {
    onLoggedIn,
    ...options
  }: Partial<{ onLoggedIn: () => void } & MagicLinkAuthOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  const [status, setStatus] = useState<
    "init" | "waitingForProvider" | "authorized" | "error"
  >("init");

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuth(
      context.node.crypto,
      context.authenticate,
      authSecretStorage,
      origin,
      options,
    );
  }, [origin, options]);

  useEffect(() => {
    async function handleFlow() {
      try {
        // Read URL and load transfer
        let transfer = await magicLinkAuth.acceptTransferUrl(url, "consumer");
        transfer = await magicLinkAuth.handleTransferAsConsumer(transfer);

        // Wait for the provider to set the transfer secret
        transfer = await waitForCoValueCondition(transfer, {}, (t) =>
          Boolean(t.secret),
        );
        if (!transfer.secret) throw new Error("Transfer secret not set");

        // Log in using the transfer secret
        setStatus("authorized");
        await magicLinkAuth.logInViaTransfer(transfer);
        onLoggedIn?.();
      } catch (error) {
        console.error("Magic Link Auth error", error);
        setStatus("error");
      }
    }

    handleFlow();
  }, [url]);

  return {
    status,
  } as const;
}

export function useHandleMagicLinkAuthAsProvider(
  origin: string,
  url: string,
  {
    autoConfirmLogIn,
    ...options
  }: Partial<{ autoConfirmLogIn: boolean } & MagicLinkAuthOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  const [status, setStatus] = useState<
    "init" | "waitingForConfirmLogIn" | "authorized" | "expired" | "error"
  >("init");
  const [confirmLogIn, setConfirmLogIn] = useState<null | (() => void)>(null);
  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuth(
      context.node.crypto,
      context.authenticate,
      authSecretStorage,
      origin,
      options,
    );
  }, [origin, options]);

  useEffect(() => {
    async function handleFlow() {
      try {
        const transfer = await magicLinkAuth.acceptTransferUrl(url, "provider");

        // Wait for the consumer to confirm the transfer
        if (!autoConfirmLogIn) {
          setStatus("waitingForConfirmLogIn");
          await new Promise<void>((resolve) => setConfirmLogIn(() => resolve));
          setConfirmLogIn(null);
        }

        // Check if the transfer has expired
        if (transfer.expiresAt && transfer.expiresAt < new Date()) {
          setStatus("expired");
          return;
        }

        // Reveal the secret to the transfer
        await magicLinkAuth.revealSecretToTransfer(transfer);

        // Wait for the transfer to be authorized and update the status
        await waitForCoValueCondition(
          transfer,
          {},
          (t) => t.status === "authorized",
        );
        setStatus("authorized");
      } catch (error) {
        console.error("Magic Link Auth error", error);
        setStatus("error");
      }
    }

    handleFlow();
  }, [url]);

  return {
    status,
    confirmLogIn: () => confirmLogIn?.(),
  } as const;
}
