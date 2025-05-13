import type { SyncMessage } from "cojson";
import { BatchedOutgoingMessages } from "./BatchedOutgoingMessages.js";
import {
  BUFFER_LIMIT,
  BUFFER_LIMIT_POLLING_INTERVAL,
} from "./createWebSocketPeer.js";
import type { AnyWebSocket } from "./types.js";

export function waitForWebSocketOpen(websocket: AnyWebSocket) {
  return new Promise<void>((resolve) => {
    if (websocket.readyState === 1) {
      resolve();
    } else {
      websocket.addEventListener("open", () => resolve(), { once: true });
    }
  });
}
export function createOutgoingMessagesManager(
  websocket: AnyWebSocket,
  batchingByDefault: boolean,
) {
  let closed = false;
  const outgoingMessages = new BatchedOutgoingMessages((messages) => {
    if (websocket.readyState === 1) {
      websocket.send(messages);
    }
  });

  let batchingEnabled = batchingByDefault;

  async function sendMessage(msg: SyncMessage) {
    if (closed) {
      return Promise.reject(new Error("WebSocket closed"));
    }

    if (websocket.readyState !== 1) {
      await waitForWebSocketOpen(websocket);
    }

    while (
      websocket.bufferedAmount > BUFFER_LIMIT &&
      websocket.readyState === 1
    ) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, BUFFER_LIMIT_POLLING_INTERVAL),
      );
    }

    if (websocket.readyState !== 1) {
      return;
    }

    if (!batchingEnabled) {
      websocket.send(JSON.stringify(msg));
    } else {
      outgoingMessages.push(msg);
    }
  }

  return {
    sendMessage,
    setBatchingEnabled(enabled: boolean) {
      batchingEnabled = enabled;
    },
    close() {
      closed = true;
      outgoingMessages.close();
    },
  };
}
