"use client";

type BroadcastMessage = {
  type: "broadcast";
  event: string;
  payload?: unknown;
};

type Handler = (payload: unknown) => void;

const MAX_RECONNECT_DELAY_MS = 15000;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const TOKEN_FETCH_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Thin replacement for a Supabase realtime channel: connects to the
// Cloudflare Durable Object relay for one room, replays broadcast-shaped
// messages to registered handlers, and reconnects with backoff on drop.
export class RoomSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private closed = false;
  private reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly wsBaseUrl: string,
    private readonly roomCode: string,
    private readonly getToken: () => Promise<string>,
  ) {}

  async connect(): Promise<void> {
    if (this.closed) return;

    // React Strict Mode double-invokes effects synchronously on mount
    // (mount -> cleanup -> mount) before any microtask runs. Yielding here
    // lets a throwaway first mount's close() land before this instance ever
    // calls getToken(), so Strict Mode never fires two concurrent
    // mintRealtimeToken() calls for the same room (which, per below, one of
    // them then hangs on in dev).
    await Promise.resolve();
    if (this.closed) return;

    let token: string;
    try {
      // A hung token fetch (observed in dev under React Strict Mode, when
      // two near-simultaneous mount/cleanup/remount cycles both call the
      // same server action) must not leave the socket stuck forever —
      // time out and let scheduleReconnect() retry with a fresh call.
      token = await withTimeout(
        this.getToken(),
        TOKEN_FETCH_TIMEOUT_MS,
        "Timed out minting realtime token",
      );
    } catch (err) {
      console.error("Failed to mint realtime token:", err);
      this.scheduleReconnect();
      return;
    }

    // close() can run while the token fetch above is in flight (e.g. the
    // component unmounts, or React's dev-mode double-invoke of effects).
    // Without this check, connect() would open a real WebSocket anyway,
    // after cleanup already stripped its handlers — a live, handler-less
    // socket that silently swallows every broadcast forever.
    if (this.closed) return;

    const url = `${this.wsBaseUrl}/room/${this.roomCode}/connect?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);

    ws.addEventListener("open", () => {
      this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    });

    ws.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;

      let message: BroadcastMessage;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type !== "broadcast") return;

      const handlers = this.handlers.get(message.event);
      handlers?.forEach((handler) => handler(message.payload));
    });

    ws.addEventListener("close", () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (!this.closed) this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      ws.close();
    });

    this.ws = ws;
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout !== null || this.closed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        MAX_RECONNECT_DELAY_MS,
      );
      void this.connect();
    }, this.reconnectDelay);
  }

  on(event: string, handler: Handler): () => void {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }
    handlers.add(handler);
    return () => handlers!.delete(handler);
  }

  send(event: string, payload?: unknown) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "broadcast", event, payload }));
  }

  close() {
    this.closed = true;
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
