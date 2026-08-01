import { jwtVerify } from "jose";
import { RoomDO } from "./room-do";

export { RoomDO };

export interface Env {
  ROOM_DO: DurableObjectNamespace;
  REALTIME_JWT_SECRET: string;
  REALTIME_PUSH_SECRET: string;
}

const ROUTE = /^\/room\/([^/]+)\/(connect|event)$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(ROUTE);
    if (!match) {
      return new Response("Not found", { status: 404 });
    }

    const [, roomId, action] = match;
    const stub = env.ROOM_DO.get(env.ROOM_DO.idFromName(roomId));

    if (action === "connect") {
      return handleConnect(request, url, roomId, env, stub);
    }

    return handleEvent(request, env, stub);
  },
} satisfies ExportedHandler<Env>;

async function handleConnect(
  request: Request,
  url: URL,
  roomId: string,
  env: Env,
  stub: DurableObjectStub,
): Promise<Response> {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected websocket upgrade", { status: 426 });
  }

  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  let artistId: string;
  try {
    const secret = new TextEncoder().encode(env.REALTIME_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.roomId !== roomId || typeof payload.artistId !== "string") {
      return new Response("Token does not match room", { status: 403 });
    }
    artistId = payload.artistId;
  } catch {
    return new Response("Invalid or expired token", { status: 401 });
  }

  const forwardUrl = new URL(request.url);
  forwardUrl.searchParams.set("artistId", artistId);
  const forwardRequest = new Request(forwardUrl.toString(), request);

  return stub.fetch(forwardRequest);
}

async function handleEvent(
  request: Request,
  env: Env,
  stub: DurableObjectStub,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (request.headers.get("x-push-secret") !== env.REALTIME_PUSH_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  return stub.fetch(request);
}
