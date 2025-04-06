import {
  MagicLinkAuth,
  MagicLinkAuthOptions,
  waitForCoValueCondition,
} from "jazz-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthSecretStorage, useJazzContext } from "../hooks.js";

const DEFAULT_EXPIRE_IN_MS = 15 * 60 * 1000;

export interface MagicLinkAuthProviderOptions extends MagicLinkAuthOptions {
  expireInMs?: number;
}

export interface MagicLinkAuthConsumerOptions extends MagicLinkAuthOptions {
  handlerTimeout?: number;
  onLoggedIn?: () => void;
}

export function useCreateMagicLinkAuthAsProvider(
  origin: string,
  {
    expireInMs = DEFAULT_EXPIRE_IN_MS,
    ...options
  }: Partial<MagicLinkAuthProviderOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const [confirmationCode, setConfirmationCode] = useState<string | undefined>(
    undefined,
  );

  const [status, setStatus] = useState<
    | "idle"
    | "waitingForConsumer"
    | "confirmationCodeGenerated"
    | "confirmationCodeCorrect"
    | "confirmationCodeIncorrect"
    | "authorized"
    | "error"
  >("idle");

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

  const createLink = useCallback(async () => {
    let transfer = await magicLinkAuth.createTransferAsProvider();

    const url = magicLinkAuth.createLink("consumer", transfer);

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

        // Wait for confirmation code
        const code = await magicLinkAuth.createConfirmationCode();
        setConfirmationCode(code);

        setStatus("confirmationCodeGenerated");
        transfer = await waitForCoValueCondition(
          transfer,
          {},
          (t) => Boolean(t.confirmationCodeInput),
          expireInMs,
        );

        // Check if the confirmation code is correct
        if (transfer.confirmationCodeInput !== code) {
          transfer.status = "incorrectCode";
          await transfer.waitForSync();
          setStatus("confirmationCodeIncorrect");
          return;
        }
        setStatus("confirmationCodeCorrect");

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
        setConfirmationCode(undefined);
      }
    }

    handleFlow();

    return url;
  }, [magicLinkAuth]);

  return {
    status,
    createLink,
    confirmationCode,
  } as const;
}

export function useCreateMagicLinkAuthAsConsumer(
  origin: string,
  {
    handlerTimeout = 30 * 1000,
    onLoggedIn,
    ...options
  }: Partial<MagicLinkAuthConsumerOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const [sendConfirmationCode, setSendConfirmationCode] = useState<
    null | ((code: string) => void)
  >(null);

  const [status, setStatus] = useState<
    | "idle"
    | "waitingForProvider"
    | "confirmationCodeRequired"
    | "confirmationCodePending"
    | "confirmationCodeIncorrect"
    | "authorized"
    | "error"
  >("idle");

  const magicLinkAuth = useMemo(() => {
    return new MagicLinkAuth(
      context.node.crypto,
      context.authenticate,
      authSecretStorage,
      origin,
      options,
    );
  }, [origin, options]);

  const createLink = useCallback(async () => {
    let transfer = await magicLinkAuth.createTransferAsConsumer();

    const url = magicLinkAuth.createLink("provider", transfer);

    async function handleFlow() {
      try {
        // Wait for the provider to accept the transfer
        setStatus("waitingForProvider");
        transfer = await waitForCoValueCondition(
          transfer,
          {},
          (t) => Boolean(t.acceptedBy),
          handlerTimeout,
        );

        setStatus("confirmationCodeRequired");
        const code = await new Promise<string>((resolve) => {
          setSendConfirmationCode(() => (code: string) => resolve(code));
        });
        transfer.confirmationCodeInput = code;
        setStatus("confirmationCodePending");

        // Wait for provider to reject or confirm and reveal the secret
        transfer = await waitForCoValueCondition(
          transfer,
          { resolve: {} },
          (t) => t.status === "incorrectCode" || Boolean(t.secret),
          handlerTimeout,
        );

        if (transfer.status === "incorrectCode") {
          setStatus("confirmationCodeIncorrect");
          return;
        }

        // Log in using the transfer secret
        await magicLinkAuth.logInViaTransfer(transfer);
        setStatus("authorized");
        onLoggedIn?.();
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
    sendConfirmationCode,
  } as const;
}

export function useHandleMagicLinkAuthAsConsumer(
  origin: string,
  url: string,
  {
    handlerTimeout = 30 * 1000,
    onLoggedIn,
    ...options
  }: Partial<MagicLinkAuthConsumerOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const hasRunRef = useRef(false);
  const [sendConfirmationCode, setSendConfirmationCode] = useState<
    null | ((code: string) => void)
  >(null);

  const [status, setStatus] = useState<
    | "idle"
    | "confirmationCodeRequired"
    | "confirmationCodePending"
    | "confirmationCodeIncorrect"
    | "authorized"
    | "error"
  >("idle");

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
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function handleFlow() {
      try {
        let transfer = await magicLinkAuth.acceptTransferUrl(url, "consumer");

        setStatus("confirmationCodeRequired");
        const code = await new Promise<string>((resolve) => {
          setSendConfirmationCode(() => (code: string) => resolve(code));
        });
        transfer.confirmationCodeInput = code;
        setStatus("confirmationCodePending");

        // Wait for provider to reject or confirm and reveal the secret
        transfer = await waitForCoValueCondition(
          transfer,
          { resolve: {} },
          (t) => t.status === "incorrectCode" || Boolean(t.secret),
          handlerTimeout,
        );

        if (transfer.status === "incorrectCode") {
          setStatus("confirmationCodeIncorrect");
          return;
        }

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
    sendConfirmationCode,
  } as const;
}

export function useHandleMagicLinkAuthAsProvider(
  origin: string,
  url: string,
  {
    expireInMs = DEFAULT_EXPIRE_IN_MS,
    ...options
  }: Partial<MagicLinkAuthProviderOptions> = {},
) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const hasRunRef = useRef(false);
  const [confirmationCode, setConfirmationCode] = useState<string | undefined>(
    undefined,
  );

  const [status, setStatus] = useState<
    | "idle"
    | "confirmationCodeGenerated"
    | "confirmationCodeIncorrect"
    | "authorized"
    | "error"
  >("idle");

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
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function handleFlow() {
      try {
        let transfer = await magicLinkAuth.acceptTransferUrl(url, "provider");

        // Generate and set confirmation code
        const code = await magicLinkAuth.createConfirmationCode();
        setConfirmationCode(code);
        setStatus("confirmationCodeGenerated");

        // Wait for confirmation code input
        transfer = await waitForCoValueCondition(
          transfer,
          {},
          (t) => Boolean(t.confirmationCodeInput),
          expireInMs,
        );

        // Check if the confirmation code is correct
        if (transfer.confirmationCodeInput !== code) {
          transfer.status = "incorrectCode";
          await transfer.waitForSync();
          setStatus("confirmationCodeIncorrect");
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
    confirmationCode,
  } as const;
}
