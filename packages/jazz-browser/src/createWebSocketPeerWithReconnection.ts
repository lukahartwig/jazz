import { createWebSocketPeer } from "cojson-transport-ws";
import type { Account, JazzContextManager, Peer } from "jazz-tools";

export function createWebSocketPeerWithReconnection(
  peer: string,
  reconnectionTimeout: number | undefined,
  contextManager: JazzContextManager<Account>,
) {
  let currentPeer: Peer | undefined = undefined;

  let shouldTryToReconnect = true;
  let currentReconnectionTimeout = reconnectionTimeout || 500;

  function onOnline() {
    console.log("Online, resetting reconnection timeout");
    currentReconnectionTimeout = reconnectionTimeout || 500;
  }

  window.addEventListener("online", onOnline);

  async function reconnectWebSocket() {
    if (!shouldTryToReconnect) return;

    if (currentPeer) {
      contextManager.removePeer(currentPeer);

      console.log(
        "Websocket disconnected, trying to reconnect in " +
          currentReconnectionTimeout +
          "ms",
      );
      currentReconnectionTimeout = Math.min(
        currentReconnectionTimeout * 2,
        30000,
      );

      await waitForOnline(currentReconnectionTimeout);
    }

    if (!shouldTryToReconnect) return;

    currentPeer = createWebSocketPeer({
      websocket: new WebSocket(peer),
      id: peer,
      role: "server",
      onClose: reconnectWebSocket,
    });

    contextManager.addPeer(currentPeer);
  }

  return {
    enable: () => {
      shouldTryToReconnect = true;

      if (!currentPeer) {
        reconnectWebSocket();
      }
    },
    disable: () => {
      shouldTryToReconnect = false;
      window.removeEventListener("online", onOnline);
      if (currentPeer) {
        contextManager.removePeer(currentPeer);
        currentPeer = undefined;
      }
    },
  };
}
function waitForOnline(timeout: number) {
  return new Promise<void>((resolve) => {
    function handleTimeoutOrOnline() {
      clearTimeout(timer);
      window.removeEventListener("online", handleTimeoutOrOnline);
      resolve();
    }

    const timer = setTimeout(handleTimeoutOrOnline, timeout);

    window.addEventListener("online", handleTimeoutOrOnline);
  });
}
