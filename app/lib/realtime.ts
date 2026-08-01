const PUSH_URL = process.env.REALTIME_PUSH_URL;
const PUSH_SECRET = process.env.REALTIME_PUSH_SECRET;

// Called from server actions right after a mutation commits, so every
// connected client gets the change immediately instead of waiting on a
// database-replication-based subscription.
export async function publishRoomEvent(
  roomCode: string,
  event: string,
  payload?: unknown,
): Promise<void> {
  if (!PUSH_URL || !PUSH_SECRET) {
    console.warn(`Realtime not configured; dropped "${event}" for room ${roomCode}`);
    return;
  }

  try {
    const response = await fetch(`${PUSH_URL}/room/${roomCode}/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-push-secret": PUSH_SECRET,
      },
      body: JSON.stringify({ event, payload }),
    });

    if (!response.ok) {
      console.error(
        `Realtime push failed (${response.status}) room=${roomCode} event=${event}`,
      );
    }
  } catch (err) {
    console.error("Realtime push error:", err);
  }
}
