import { type Peer, logger } from "cojson";
import { createWebSocketPeer } from "./createWebSocketPeer.js";

export class WebSocketPeerWithReconnection {
  private peer: string;
  private reconnectionTimeout: number;
  private addPeer: (peer: Peer) => void;
  private removePeer: (peer: Peer) => void;

  constructor(opts: {
    peer: string;
    reconnectionTimeout: number | undefined;
    addPeer: (peer: Peer) => void;
    removePeer: (peer: Peer) => void;
  }) {
    this.peer = opts.peer;
    this.reconnectionTimeout = opts.reconnectionTimeout || 500;
    this.addPeer = opts.addPeer;
    this.removePeer = opts.removePeer;
  }

  state: "disabled" | "enabled" = "disabled";
  currentPeer: Peer | undefined = undefined;
  unsubscribeNetworkChange: (() => void) | undefined = undefined;

  // Basic implementation for environments that don't support network change events (e.g. Node.js)
  // Needs to be extended to handle platform specific APIs
  onNetworkChange(callback: (connected: boolean) => void): () => void {
    callback;
    return () => {};
  }

  waitForOnline(timeout: number) {
    return new Promise<void>((resolve) => {
      const unsubscribeNetworkChange = this.onNetworkChange((connected) => {
        if (connected) {
          handleTimeoutOrOnline();
        }
      });

      function handleTimeoutOrOnline() {
        clearTimeout(timer);
        unsubscribeNetworkChange();
        resolve();
      }

      const timer = setTimeout(handleTimeoutOrOnline, timeout);
    });
  }

  reconnectionAttempts = 0;

  startConnection = async () => {
    if (this.state !== "enabled") return;

    if (this.currentPeer) {
      this.removePeer(this.currentPeer);

      this.reconnectionAttempts++;

      const timeout = this.reconnectionTimeout * this.reconnectionAttempts;

      logger.debug(
        `Websocket disconnected, trying to reconnect in ${timeout}ms`,
      );

      await this.waitForOnline(timeout);
    }

    if (this.state !== "enabled") return;

    this.currentPeer = createWebSocketPeer({
      websocket: new WebSocket(this.peer),
      id: this.peer,
      role: "server",
      onClose: this.startConnection,
      onSuccess: () => {
        logger.debug("Websocket connection successful");

        this.reconnectionAttempts = 0;
      },
    });

    this.addPeer(this.currentPeer);
  };

  enable = () => {
    if (this.state === "enabled") return;

    this.state = "enabled";
    this.startConnection();
  };

  disable = () => {
    if (this.state === "disabled") return;

    this.state = "disabled";

    this.reconnectionAttempts = 0;
    this.unsubscribeNetworkChange?.();
    this.unsubscribeNetworkChange = undefined;

    if (this.currentPeer) {
      this.removePeer(this.currentPeer);
      this.currentPeer = undefined;
    }
  };
}
