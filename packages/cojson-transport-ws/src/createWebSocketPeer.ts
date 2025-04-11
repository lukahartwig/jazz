import {
  type DisconnectedError,
  type Peer,
  type PingTimeoutError,
  type SyncMessage,
  cojsonInternals,
  logger,
} from "cojson";
import { BatchedOutgoingMessages } from "./BatchedOutgoingMessages.js";
import { deserializeMessages } from "./serialization.js";
import type { AnyWebSocket } from "./types.js";

export const BUFFER_LIMIT = 100_000;
export const BUFFER_LIMIT_POLLING_INTERVAL = 10;

export type CreateWebSocketPeerOpts = {
  id: string;
  websocket: AnyWebSocket;
  role: Peer["role"];
  expectPings?: boolean;
  batchingByDefault?: boolean;
  deletePeerStateOnClose?: boolean;
  pingTimeout?: number;
  onClose?: () => void;
  onSuccess?: () => void;
};

function createPingTimeoutListener(
  enabled: boolean,
  timeout: number,
  callback: () => void,
) {
  if (!enabled) {
    return {
      reset() {},
      clear() {},
    };
  }

  let pingTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    reset() {
      pingTimeout && clearTimeout(pingTimeout);
      pingTimeout = setTimeout(() => {
        callback();
      }, timeout);
    },
    clear() {
      pingTimeout && clearTimeout(pingTimeout);
    },
  };
}

function waitForWebSocketOpen(websocket: AnyWebSocket) {
  return new Promise<void>((resolve) => {
    if (websocket.readyState === 1) {
      resolve();
    } else {
      websocket.addEventListener("open", () => resolve(), { once: true });
    }
  });
}

function createOutgoingMessagesManager(
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

function createClosedEventEmitter(callback = () => {}) {
  let disconnected = false;

  return () => {
    if (disconnected) return;
    disconnected = true;
    callback();
  };
}

export function createWebSocketPeer({
  id,
  websocket,
  role,
  expectPings = true,
  batchingByDefault = true,
  deletePeerStateOnClose = false,
  pingTimeout = 10_000,
  onSuccess,
  onClose,
}: CreateWebSocketPeerOpts): Peer {
  const incoming = new cojsonInternals.Channel<
    SyncMessage | DisconnectedError | PingTimeoutError
  >();
  const emitClosedEvent = createClosedEventEmitter(onClose);

  function handleClose() {
    incoming
      .push("Disconnected")
      .catch((e) =>
        logger.error("Error while pushing disconnect msg", { err: e }),
      );
    emitClosedEvent();
  }

  websocket.addEventListener("close", handleClose);
  // TODO (#1537): Remove this any once the WebSocket error event type is fixed
  // biome-ignore lint/suspicious/noExplicitAny: WebSocket error event type
  websocket.addEventListener("error" as any, (err) => {
    if (err.message) {
      logger.warn("WebSocket error", { err });
    }

    handleClose();
  });

  const pingTimeoutListener = createPingTimeoutListener(
    expectPings,
    pingTimeout,
    () => {
      incoming
        .push("PingTimeout")
        .catch((e) =>
          logger.error("Error while pushing ping timeout", { err: e }),
        );
      emitClosedEvent();
    },
  );

  const outgoingMessages = createOutgoingMessagesManager(
    websocket,
    batchingByDefault,
  );
  let isFirstMessage = true;

  function handleIncomingMsg(event: { data: unknown }) {
    pingTimeoutListener.reset();

    if (event.data === "") {
      return;
    }

    const result = deserializeMessages(event.data);

    if (!result.ok) {
      logger.warn("Error while deserializing messages", { err: result.error });
      return;
    }

    if (isFirstMessage) {
      // The only way to know that the connection has been correctly established with our sync server
      // is to track that we got a message from the server.
      onSuccess?.();
      isFirstMessage = false;
    }

    const { messages } = result;

    if (messages.length > 1) {
      // If more than one message is received, the other peer supports batching
      outgoingMessages.setBatchingEnabled(true);
    }

    for (const msg of messages) {
      if (msg && "action" in msg) {
        incoming
          .push(msg)
          .catch((e) =>
            logger.error("Error while pushing incoming msg", { err: e }),
          );
      }
    }
  }

  websocket.addEventListener("message", handleIncomingMsg);

  return {
    id,
    incoming,
    outgoing: {
      push: outgoingMessages.sendMessage,
      close() {
        outgoingMessages.close();

        websocket.removeEventListener("message", handleIncomingMsg);
        websocket.removeEventListener("close", handleClose);
        pingTimeoutListener.clear();
        emitClosedEvent();

        if (websocket.readyState === 0) {
          websocket.addEventListener(
            "open",
            function handleClose() {
              websocket.close();
            },
            { once: true },
          );
        } else if (websocket.readyState === 1) {
          websocket.close();
        }
      },
    },
    role,
    crashOnClose: false,
    deletePeerStateOnClose,
  };
}
