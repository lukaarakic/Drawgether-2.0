"use server";

import { SignJWT } from "jose";
import { getArtistId } from "../auth-utils";

function realtimeSecret() {
  return new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!);
}

// Short-lived token the client exchanges for a websocket connection to the
// Cloudflare relay. Scoped to one room so the worker can reject mismatches.
export async function mintRealtimeToken(roomCode: string): Promise<string> {
  const { artistId } = await getArtistId();

  return new SignJWT({ roomId: roomCode, artistId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(realtimeSecret());
}
