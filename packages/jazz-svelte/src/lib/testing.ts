import {
  Account,
  AnonymousJazzAgent
} from "jazz-tools";
import { JAZZ_CTX, type JazzContext } from './jazz.svelte.js';
import { getJazzContextShape } from "jazz-tools/testing";

export function createJazzTestContext<Acc extends Account>({ account }: {
  account: Acc | { guest: AnonymousJazzAgent };
}) {
  const ctx = new Map<typeof JAZZ_CTX, JazzContext<Acc>>();

  const value = getJazzContextShape(account);

  if ('guest' in account) {
    ctx.set(JAZZ_CTX, {
      current: value
    });
  } else {
    ctx.set(JAZZ_CTX, {
      current: value
    });
  } 

  return ctx;
}

export {
  createJazzTestAccount,
  createJazzTestGuest,
  linkAccounts
} from "jazz-tools/testing";
