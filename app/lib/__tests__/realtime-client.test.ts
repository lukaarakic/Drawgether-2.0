import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomSocket } from "../realtime-client";

type Listener = (event: unknown) => void;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  url: string;
  sent: string[] = [];
  private listeners = new Map<string, Set<Listener>>();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, cb: Listener) {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(cb);
  }

  send(data: string) {
    this.sent.push(data);
  }

  // Simulates the socket actually closing (server drop, network error, or
  // an intentional close) — always fires "close" listeners, same as a real
  // WebSocket regardless of who or what triggered it.
  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch("close", {});
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.dispatch("open", {});
  }

  simulateMessage(data: unknown) {
    this.dispatch("message", { data });
  }

  private dispatch(type: string, event: unknown) {
    this.listeners.get(type)?.forEach((cb) => cb(event));
  }
}

function latestSocket(): MockWebSocket {
  const socket = MockWebSocket.instances.at(-1);
  if (!socket) throw new Error("No WebSocket was constructed");
  return socket;
}

describe("RoomSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens a websocket to the right URL with the minted token", async () => {
    const getToken = vi.fn().mockResolvedValue("tok123");
    const socket = new RoomSocket("wss://relay.example.com", "ABCD12", getToken);

    await socket.connect();

    expect(getToken).toHaveBeenCalledOnce();
    expect(latestSocket().url).toBe(
      "wss://relay.example.com/room/ABCD12/connect?token=tok123",
    );
  });

  it("delivers broadcast messages only to handlers for that event", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    latestSocket().simulateOpen();

    const drawHandler = vi.fn();
    const chatHandler = vi.fn();
    socket.on("draw_batch", drawHandler);
    socket.on("chat", chatHandler);

    latestSocket().simulateMessage(
      JSON.stringify({ type: "broadcast", event: "draw_batch", payload: { x: 1 } }),
    );

    expect(drawHandler).toHaveBeenCalledWith({ x: 1 });
    expect(chatHandler).not.toHaveBeenCalled();
  });

  it("ignores non-broadcast and malformed messages instead of throwing", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    latestSocket().simulateOpen();

    const handler = vi.fn();
    socket.on("draw_batch", handler);

    expect(() => latestSocket().simulateMessage("not json")).not.toThrow();
    expect(() =>
      latestSocket().simulateMessage(JSON.stringify({ type: "other", event: "draw_batch" })),
    ).not.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it("on() returns an unsubscribe function that stops future delivery", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    latestSocket().simulateOpen();

    const handler = vi.fn();
    const unsubscribe = socket.on("ping", handler);
    unsubscribe();

    latestSocket().simulateMessage(JSON.stringify({ type: "broadcast", event: "ping" }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("send() writes a broadcast envelope once the socket is open", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    latestSocket().simulateOpen();

    socket.send("draw_dot", { x: 1, y: 2 });

    expect(latestSocket().sent).toEqual([
      JSON.stringify({ type: "broadcast", event: "draw_dot", payload: { x: 1, y: 2 } }),
    ]);
  });

  it("send() is a silent no-op before the socket is open", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    // deliberately not calling simulateOpen()

    expect(() => socket.send("draw_dot", { x: 1 })).not.toThrow();
    expect(latestSocket().sent).toEqual([]);
  });

  it("reconnects with exponential backoff after an unexpected drop", async () => {
    const getToken = vi.fn().mockResolvedValue("tok");
    const socket = new RoomSocket("wss://relay", "ROOM01", getToken);

    await socket.connect();
    latestSocket().simulateOpen();
    expect(MockWebSocket.instances).toHaveLength(1);

    // Server drops the connection (not a call to socket.close()).
    latestSocket().close();

    // First retry: after 1000ms.
    await vi.advanceTimersByTimeAsync(999);
    expect(MockWebSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(MockWebSocket.instances).toHaveLength(2);

    // Second drop backs off to 2000ms, not another 1000ms.
    latestSocket().close();
    await vi.advanceTimersByTimeAsync(1999);
    expect(MockWebSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(MockWebSocket.instances).toHaveLength(3);

    expect(getToken).toHaveBeenCalledTimes(3);
  });

  it("caps reconnect backoff at 15s instead of growing unbounded", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    latestSocket().simulateOpen();

    // Drive enough drops that unbounded doubling (1s,2s,4s,8s,16s,32s...)
    // would already have blown past the 15s cap.
    for (let i = 0; i < 6; i++) {
      latestSocket().close();
      await vi.advanceTimersByTimeAsync(15000);
    }

    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(7);
  });

  it("does not reconnect after an intentional close()", async () => {
    const getToken = vi.fn().mockResolvedValue("tok");
    const socket = new RoomSocket("wss://relay", "ROOM01", getToken);

    await socket.connect();
    latestSocket().simulateOpen();

    socket.close();

    await vi.advanceTimersByTimeAsync(30000);

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(getToken).toHaveBeenCalledOnce();
  });

  it("resets backoff to the initial delay after a successful reconnect", async () => {
    const socket = new RoomSocket("wss://relay", "ROOM01", async () => "tok");
    await socket.connect();
    latestSocket().simulateOpen();

    // First drop/reconnect grows the delay to 2s.
    latestSocket().close();
    await vi.advanceTimersByTimeAsync(1000);
    latestSocket().simulateOpen();

    // A clean open resets the delay, so the next drop should retry after
    // 1s again, not the grown 2s.
    latestSocket().close();
    await vi.advanceTimersByTimeAsync(999);
    expect(MockWebSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it("still schedules a reconnect if getToken() rejects", async () => {
    const getToken = vi.fn().mockRejectedValueOnce(new Error("network error"));
    getToken.mockResolvedValue("tok");
    const socket = new RoomSocket("wss://relay", "ROOM01", getToken);

    await socket.connect();
    expect(MockWebSocket.instances).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("never opens a WebSocket if close() runs while the token fetch is still in flight", async () => {
    // Reproduces the React Strict Mode dev-mode scenario: mount -> cleanup
    // (close()) -> remount, where cleanup fires before the first connect()
    // call's token fetch has resolved. Without re-checking `closed` after
    // the await, connect() would open a socket nobody is tracking anymore.
    let resolveToken!: (token: string) => void;
    const pendingToken = new Promise<string>((resolve) => {
      resolveToken = resolve;
    });
    const socket = new RoomSocket("wss://relay", "ROOM01", () => pendingToken);

    const connectPromise = socket.connect();
    socket.close();
    resolveToken("tok");
    await connectPromise;

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("never calls getToken() for a Strict-Mode mount that's cleaned up before the next microtask", async () => {
    // Reproduces React Strict Mode's synchronous mount -> cleanup -> mount:
    // socket A connects and is closed before any microtask (and therefore
    // before its getToken() call) runs, then socket B connects for real.
    // Only B should ever call getToken() - A must bail out first.
    const getToken = vi.fn().mockResolvedValue("tok");

    const socketA = new RoomSocket("wss://relay", "ROOM01", getToken);
    const connectA = socketA.connect();
    socketA.close();

    const socketB = new RoomSocket("wss://relay", "ROOM01", getToken);
    const connectB = socketB.connect();

    await Promise.all([connectA, connectB]);

    expect(getToken).toHaveBeenCalledOnce();
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("gives up on a hung token fetch and reconnects instead of hanging forever", async () => {
    // The token fetch here never resolves or rejects — connect() must not
    // get stuck: a hung request should be treated as a failure that
    // triggers the normal backoff/retry path, same as an outright reject.
    const hungGetToken = vi.fn().mockReturnValue(new Promise<string>(() => {}));
    const workingGetToken = vi.fn().mockResolvedValue("tok");
    let callCount = 0;
    const getToken = vi.fn(() => {
      callCount++;
      return callCount === 1 ? hungGetToken() : workingGetToken();
    });

    const socket = new RoomSocket("wss://relay", "ROOM01", getToken);

    const connectPromise = socket.connect();
    await vi.advanceTimersByTimeAsync(8000);
    await connectPromise;

    expect(MockWebSocket.instances).toHaveLength(0);

    // scheduleReconnect() kicks in after the initial 1s backoff.
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
