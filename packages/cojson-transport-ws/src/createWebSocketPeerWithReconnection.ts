import {
  type DisconnectedError,
  type Peer,
  type PingTimeoutError,
  type SyncMessage,
  cojsonInternals,
  logger,
} from "cojson";
import { deserializeMessages } from "./serialization.js";
import { createPingTimeoutListener } from "./tests/utils.js";
import type { AnyWebSocketConstructor } from "./types.js";
import { createOutgoingMessagesManager } from "./utils.js";

export type CreateWebSocketPeerWithReconnectionOpts = {
  id: string;
  WebSocketConstructor?: AnyWebSocketConstructor;
  role: Peer["role"];
  expectPings?: boolean;
  batchingByDefault?: boolean;
  deletePeerStateOnClose?: boolean;
  pingTimeout?: number;
  url: string;
  reconnectionTimeout?: number | undefined;
};

export function createWebSocketPeerWithReconnection({
  id,
  WebSocketConstructor = WebSocket,
  role,
  expectPings = true,
  batchingByDefault = true,
  deletePeerStateOnClose = false,
  pingTimeout = 5_000,
  url,
  reconnectionTimeout = 500,
}: CreateWebSocketPeerWithReconnectionOpts) {
  let isClosed = false;
  let reconnecting = false;

  const incoming = new cojsonInternals.Channel<
    SyncMessage | DisconnectedError | PingTimeoutError
  >();

  function handleClose() {
    if (isClosed) return;
    if (reconnecting) return;

    websocket.removeEventListener("message", handleIncomingMsg);
    websocket.removeEventListener("close", handleClose);

    if (websocket.readyState === 1) {
      websocket.close();
    } else if (websocket.readyState === 0) {
      const thisWebSocket = websocket;
      websocket.addEventListener(
        "open",
        () => {
          websocket.close();
        },
        { once: true },
      );
    }

    reconnecting = true;

    setTimeout(() => {
      if (isClosed) return;

      reconnecting = false;
      websocket = createWebSocket();
    }, reconnectionTimeout);
  }

  function createWebSocket() {
    const websocket = new WebSocketConstructor(url);

    websocket.addEventListener("close", handleClose);

    // biome-ignore lint/suspicious/noExplicitAny: WebSocket error event type is not standardized
    websocket.addEventListener("error" as any, (err) => {
      if (err.message) {
        logger.warn(`WebSocket error: ${err.message}`, { err });
      }

      handleClose();
    });

    websocket.addEventListener("message", handleIncomingMsg);

    return websocket;
  }

  const pingTimeoutListener = createPingTimeoutListener(
    expectPings,
    pingTimeout,
    () => {
      handleClose();
    },
  );

  let websocket = createWebSocket();

  const outgoingMessages = createOutgoingMessagesManager(
    websocket,
    batchingByDefault,
  );

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

  return {
    id,
    incoming,
    outgoing: {
      push: outgoingMessages.sendMessage,
      close() {
        isClosed = true;
        outgoingMessages.close();

        websocket.close();
        pingTimeoutListener.clear();
        incoming
          .push("Disconnected")
          .catch((e) =>
            logger.error("Error while pushing disconnect msg", { err: e }),
          );
      },
    },
    role,
    crashOnClose: false,
    deletePeerStateOnClose,
  } satisfies Peer;
}
