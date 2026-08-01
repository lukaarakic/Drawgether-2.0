export interface Env {
  REALTIME_PUSH_SECRET: string;
}

interface BroadcastMessage {
  type: "broadcast";
  event: string;
  payload?: unknown;
}

function isBroadcastMessage(value: unknown): value is BroadcastMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "broadcast" &&
    typeof (value as { event?: unknown }).event === "string"
  );
}

// One instance per game room (looked up by DO name = roomId). Relays
// broadcast-shaped JSON messages between connected clients, and lets the
// Next.js server push room-lifecycle events (join/kick/status) the same way.
export class RoomDO {
  private readonly state: DurableObjectState;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method === "POST") {
      return this.handleServerPush(request);
    }
    return this.handleWebSocketUpgrade(request);
  }

  private async handleServerPush(request: Request): Promise<Response> {
    let body: { event?: unknown; payload?: unknown };
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (typeof body.event !== "string") {
      return new Response("Missing event", { status: 400 });
    }

    this.broadcast(
      { type: "broadcast", event: body.event, payload: body.payload },
      null,
    );
    return new Response("ok");
  }

  private handleWebSocketUpgrade(request: Request): Response {
    const url = new URL(request.url);
    const artistId = url.searchParams.get("artistId") ?? "unknown";

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Hibernation API: the DO can be evicted between messages without
    // dropping the socket, so idle connections don't keep billing active.
    this.state.acceptWebSocket(server, [artistId]);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    if (!isBroadcastMessage(parsed)) return;

    // Mirrors Supabase's `broadcast: { self: false }` — sender draws locally
    // already, so only relay to everyone else in the room.
    this.broadcast(parsed, ws);
  }

  async webSocketClose(ws: WebSocket) {
    try {
      ws.close();
    } catch {
      // already closed
    }
  }

  async webSocketError(ws: WebSocket) {
    try {
      ws.close();
    } catch {
      // already closed
    }
  }

  private broadcast(message: BroadcastMessage, exclude: WebSocket | null) {
    const serialized = JSON.stringify(message);
    for (const socket of this.state.getWebSockets()) {
      if (socket === exclude) continue;
      try {
        socket.send(serialized);
      } catch {
        // socket is closing/closed; hibernation API will clean it up
      }
    }
  }
}
