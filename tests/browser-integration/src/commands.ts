/// <reference types="@vitest/browser/providers/playwright" />

/**
 * Vitest commands that we can run on the server side to generate chaos and spawn sync servers
 * https://vitest.dev/guide/browser/commands.html
 */

import type { BrowserCommand } from "vitest/node";
import { TestSyncServer, startSyncServer } from "./syncServer";

const syncServers = new Map<string, TestSyncServer>();

const startSyncServerCommand: BrowserCommand<
  [arg1: string, arg2: string]
> = async () => {
  const syncServer = await startSyncServer(0);

  syncServers.set(syncServer.url, syncServer);

  return {
    url: syncServer.url,
  };
};

const disconnectAllClientsCommand: BrowserCommand<[url: string]> = async (
  ctx,
  url,
) => {
  const syncServer = syncServers.get(url);

  if (!syncServer) {
    throw new Error(`Sync server not found for url: ${url}`);
  }

  syncServer.disconnectAllClients();
};

const setOfflineCommand: BrowserCommand<
  [url: string, active: boolean]
> = async (ctx, url, active) => {
  const syncServer = syncServers.get(url);

  if (!syncServer) {
    throw new Error(`Sync server not found for url: ${url}`);
  }

  syncServer.setActive(active);
};

const closeSyncServerCommand: BrowserCommand<[url: string]> = async (
  ctx,
  url,
) => {
  const syncServer = syncServers.get(url);

  if (!syncServer) {
    throw new Error(`Sync server not found for url: ${url}`);
  }

  syncServer.close();
};

declare module "@vitest/browser/context" {
  interface BrowserCommands {
    startSyncServer: () => Promise<{
      url: `ws://localhost:${number}`;
    }>;
    disconnectAllClients: (url: string) => Promise<void>;
    setOffline: (url: string, active: boolean) => Promise<void>;
    closeSyncServer: (url: string) => Promise<void>;
  }
}

export const customCommands = {
  startSyncServer: startSyncServerCommand,
  disconnectAllClients: disconnectAllClientsCommand,
  setOffline: setOfflineCommand,
  closeSyncServer: closeSyncServerCommand,
};
