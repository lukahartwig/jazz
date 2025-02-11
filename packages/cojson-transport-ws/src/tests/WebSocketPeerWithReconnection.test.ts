import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WebSocketPeerWithReconnection } from "../WebSocketPeerWithReconnection";
import { startSyncServer } from "./syncServer";
import { waitFor } from "./utils";

describe("WebSocketPeerWithReconnection", () => {
  let server: any;
  let syncServerUrl: string;

  beforeEach(async () => {
    const result = await startSyncServer();
    server = result;
    syncServerUrl = result.syncServer;
  });

  afterEach(() => {
    server.close();
  });

  test("should connect successfully to sync server", async () => {
    const addPeer = vi.fn();
    const removePeer = vi.fn();

    const peer = new WebSocketPeerWithReconnection({
      peer: syncServerUrl,
      reconnectionTimeout: 100,
      addPeer,
      removePeer,
    });

    peer.enable();

    // Wait for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(addPeer).toHaveBeenCalledTimes(1);
    expect(removePeer).not.toHaveBeenCalled();

    peer.disable();
  });

  test("should attempt reconnection when server disconnects", async () => {
    const addPeer = vi.fn();
    const removePeer = vi.fn();

    const peer = new WebSocketPeerWithReconnection({
      peer: syncServerUrl,
      reconnectionTimeout: 100,
      addPeer,
      removePeer,
    });

    peer.enable();

    // Wait for initial connection
    await new Promise((resolve) => setTimeout(resolve, 100));

    addPeer.mockClear();

    // Close server to simulate disconnect
    server.close();

    // Wait for disconnect to be detected
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(removePeer).toHaveBeenCalled();
    expect(peer.reconnectionAttempts).toBeGreaterThan(0);

    // Start server again
    server = await startSyncServer(server.port);

    // Wait for reconnection
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(addPeer).toHaveBeenCalled();

    peer.disable();
  });

  test("should stop reconnection attempts when disabled", async () => {
    const addPeer = vi.fn();
    const removePeer = vi.fn();

    const peer = new WebSocketPeerWithReconnection({
      peer: syncServerUrl,
      reconnectionTimeout: 100,
      addPeer,
      removePeer,
    });

    peer.enable();

    // Wait for initial connection
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Close server and disable peer
    server.close();
    peer.disable();

    // Wait to ensure no reconnection attempts
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(addPeer).toHaveBeenCalledTimes(1);
    expect(removePeer).toHaveBeenCalledTimes(1);
    expect(peer.reconnectionAttempts).toBe(0);
  });

  test("should reset reconnection attempts when connection is successful", async () => {
    const addPeer = vi.fn();
    const removePeer = vi.fn();

    const peer = new WebSocketPeerWithReconnection({
      peer: syncServerUrl,
      reconnectionTimeout: 10,
      addPeer,
      removePeer,
    });

    peer.enable();

    // Wait for initial connection
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Close server to trigger reconnection attempts
    server.close();

    // Wait for some reconnection attempts
    await new Promise((resolve) => setTimeout(resolve, 300));

    const previousAttempts = peer.reconnectionAttempts;
    expect(previousAttempts).toBeGreaterThan(0);

    // Start server again
    server = await startSyncServer(server.port);

    // Wait for successful reconnection
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await waitFor(() => expect(peer.reconnectionAttempts).toBe(0));

    peer.disable();
  });
});
