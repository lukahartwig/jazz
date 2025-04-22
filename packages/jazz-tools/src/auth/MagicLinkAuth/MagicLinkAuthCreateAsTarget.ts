import { waitForCoValueCondition } from "../../internal.js";
import { MagicLinkAuth } from "./MagicLinkAuth.js";
import { MagicLinkAuthAsTargetOptions } from "./types.js";
import { shutdownTransferAccount } from "./utils.js";

export type MagicLinkAuthCreateAsTargetStatus =
  | "idle"
  | "waitingForHandler"
  | "confirmationCodeRequired"
  | "confirmationCodePending"
  | "confirmationCodeIncorrect"
  | "authorized"
  | "error"
  | "cancelled";

export class MagicLinkAuthCreateAsTarget {
  constructor(
    private magicLinkAuth: MagicLinkAuth,
    options?: MagicLinkAuthAsTargetOptions,
  ) {
    this.options = { ...defaultOptions, ...options };
  }

  private options: MagicLinkAuthAsTargetOptions;
  private abortController: AbortController | null = null;

  public authState: {
    status: MagicLinkAuthCreateAsTargetStatus;
    sendConfirmationCode: undefined | ((code: string) => void);
  } = {
    status: "idle",
    sendConfirmationCode: undefined,
  };

  private set status(status: MagicLinkAuthCreateAsTargetStatus) {
    this.authState = { ...this.authState, status };
  }
  private set sendConfirmationCode(sendConfirmationCode:
    | undefined
    | ((code: string) => void)) {
    this.authState = { ...this.authState, sendConfirmationCode };
  }

  public async createLink() {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    let transfer = await this.magicLinkAuth.createTransfer();

    const url = this.magicLinkAuth.createLink("source", transfer);

    const handleFlow = async () => {
      try {
        // Wait for the source device to accept the transfer
        this.status = "waitingForHandler";
        this.notify();

        transfer = await waitForCoValueCondition(
          transfer,
          { abortSignal: signal },
          (t) => Boolean(t.acceptedBy),
          this.options.handlerTimeout,
        );

        this.status = "confirmationCodeRequired";
        this.notify();

        const code = await new Promise<string>((resolve, reject) => {
          this.sendConfirmationCode = (code: string) => resolve(code);
          signal.addEventListener("abort", () => reject(new Error("Aborted")));
        });

        transfer.confirmationCodeInput = code;
        this.status = "confirmationCodePending";
        this.notify();

        // Wait for source device to reject or confirm and reveal the secret
        transfer = await waitForCoValueCondition(
          transfer,
          { resolve: {}, abortSignal: signal },
          (t) => t.status === "incorrectCode" || Boolean(t.secret),
          this.options.handlerTimeout,
        );

        if (transfer.status === "incorrectCode") {
          this.status = "confirmationCodeIncorrect";
          this.notify();
          return;
        }

        // Log in using the transfer secret
        await this.magicLinkAuth.logInViaTransfer(transfer);
        this.status = "authorized";
        this.notify();
        this.options.onLoggedIn?.();
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Aborted")) {
          this.status = "cancelled";
        } else {
          console.error("Magic Link Auth error", error);
          this.status = "error";
        }
        this.notify();
      } finally {
        this.abortController = null;
        shutdownTransferAccount(transfer);
      }
    };

    handleFlow();

    return url;
  }

  public cancelFlow() {
    this.abortController?.abort();
  }

  listeners = new Set<() => void>();
  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  };
  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const defaultOptions: MagicLinkAuthAsTargetOptions = {
  handlerTimeout: 30 * 1000,
};
