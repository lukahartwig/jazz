import type { CryptoProvider } from "cojson";

/**
 * Options for the MagicLinkAuth class.
 */
export interface MagicLinkAuthOptions {
  /**
   * Function to generate a confirmation code.
   * @param crypto - The crypto provider to use for random number generation.
   * @returns The generated confirmation code.
   */
  confirmationCodeFn: (crypto: CryptoProvider) => string | Promise<string>;
  /**
   * The path to the consumer handler.
   */
  targetHandlerPath: string;
  /**
   * The path to the provider handler.
   */
  sourceHandlerPath: string;
}

/**
 * Options for MagicLinkAuth consumer classes.
 */
export interface MagicLinkAuthAsTargetOptions {
  /**
   * The timeout for the consumer handler.
   */
  handlerTimeout?: number;
  /**
   * The function to call when the consumer is logged in.
   */
  onLoggedIn?: () => void;
}

/**
 * Options for MagicLinkAuth provider classes.
 */
export interface MagicLinkAuthAsSourceOptions {
  /**
   * The expiration time for the provider.
   */
  expireInMs?: number;
}
