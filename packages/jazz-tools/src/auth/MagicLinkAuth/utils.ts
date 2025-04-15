import { type CryptoProvider, LocalNode, cojsonInternals } from "cojson";
import { Account } from "../../coValues/account.js";
import type { MagicLinkAuthTransfer } from "./MagicLinkAuth.js";
import type { MagicLinkAuthOptions } from "./types.js";

/**
 * Create a temporary agent to keep the transfer secret isolated from persistent accounts.
 * @param crypto - The crypto provider to use for agent creation.
 * @returns The created Account.
 */
export async function createTemporaryAgent(crypto: CryptoProvider) {
  const [localPeer, magicLinkAuthPeer] = cojsonInternals.connectedPeers(
    "local",
    "magicLinkAuth",
    { peer1role: "server", peer2role: "client" },
  );
  Account.getMe()._raw.core.node.syncManager.addPeer(magicLinkAuthPeer);

  const { node } = await LocalNode.withNewlyCreatedAccount({
    creationProps: { name: "Sandbox account" },
    peersToLoadFrom: [localPeer],
    crypto,
  });
  return Account.fromNode(node);
}

/**
 * Default function to generate a 6-digit confirmation code.
 * @param crypto - The crypto provider to use for random number generation.
 * @returns The generated confirmation code.
 */
async function defaultConfirmationCodeFn(crypto: CryptoProvider) {
  let code = "";
  while (code.length < 6) {
    // value is 0-15
    const value = crypto.randomBytes(1)[0]! & 0x0f;
    // discard values >=10 for uniform distribution 0-9
    if (value >= 10) continue;
    code += value.toString();
  }
  return code;
}

export function shutdownTransferAccount(
  transfer: MagicLinkAuthTransfer | undefined,
) {
  if (!transfer || transfer._loadedAs._type !== "Account") return;
  transfer._loadedAs._raw.core.node.gracefulShutdown();
}

export const defaultOptions: MagicLinkAuthOptions = {
  confirmationCodeFn: defaultConfirmationCodeFn,
  consumerHandlerPath: "/magic-link-handler-consumer",
  providerHandlerPath: "/magic-link-handler-provider",
};
