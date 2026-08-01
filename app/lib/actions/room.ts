"use server";

import { generateRoomCode } from "@/app/utils/misc";
import { getArtistId } from "../auth-utils";
import { redirect } from "next/navigation";
import z from "zod";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import OpenAI from "openai";
import { RoomStatus } from "@/drizzle/types";
import { publishRoomEvent } from "../realtime";
import { uploadArtworkImage } from "../artwork-storage";
import { createArtworkForRoom } from "../data/artworks";
import {
  activateRoomState,
  beginStartCountdown,
  cacheRoomOpening,
  cancelStartCountdown,
  createRoomWithOwner,
  finalizeStartingCountdown,
  getArtistRoomCode,
  getArtistRoomId,
  getHostRoomSnapshot,
  getRoomActivationSnapshot,
  getRoomJoinInfo,
  getRoomOwnerId,
  getRoomThemeWithArtistIds,
  isArtistInRoom,
  joinRoomAsArtist,
  removeArtistFromRoom,
} from "../data/rooms";

const STARTING_COUNTDOWN_MS = 10000;
const GAME_DURATION_MS = 5 * 60 * 1000;
const LATE_JOIN_WINDOW_MS = 30 * 1000;
const FALLBACK_INTRO_MESSAGE =
  "We hope you'll have fun playing our game! Get your ideas ready.";
const FALLBACK_TOPICS = [
  "A blue man wearing a purple jacket",
  "A sleepy dragon curled up on a library rug",
  "A glowing jellyfish floating above a city park",
  "A robot chef making pancakes in the rain",
  "A tiny castle balanced on top of a mushroom",
];

type RoomOpening = {
  introMessage: string;
  topic: string;
};

const openAIClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function getFallbackOpening(roomId: string): RoomOpening {
  const topicIndex =
    roomId.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    FALLBACK_TOPICS.length;

  return {
    introMessage: FALLBACK_INTRO_MESSAGE,
    topic: FALLBACK_TOPICS[topicIndex],
  };
}

function getRoomOpeningPrompt() {
  return {
    system:
      'You generate short, family-friendly drawing game openings. Return valid JSON only with exactly two keys: "introMessage" and "topic".',
    user: `Create an intro message and a drawing topic for a multiplayer drawing game.

Rules:
- introMessage: 1 short upbeat sentences
- topic: short (3-4 words max), visual, imaginative, and easy to draw
- family-friendly only
- no copyrighted characters, brands, or celebrities
- no politics, violence, gore, or sexual content
- output raw JSON only

Example shape:
{
  "introMessage": "We hope you'll have fun playing our game!",
  "topic": "A blue man wearing a purple jacket"
}`,
  };
}

async function generateRoomOpening(roomId: string): Promise<RoomOpening> {
  if (!openAIClient) {
    return getFallbackOpening(roomId);
  }

  const prompt = getRoomOpeningPrompt();

  try {
    const response = await openAIClient.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt.system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt.user }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "room_opening",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              introMessage: { type: "string" },
              topic: { type: "string" },
            },
            required: ["introMessage", "topic"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as Partial<RoomOpening>;
    const introMessage = parsed.introMessage?.trim();
    const topic = parsed.topic?.trim();

    if (!introMessage || !topic) {
      throw new Error("OpenAI returned an incomplete room opening");
    }

    return { introMessage, topic };
  } catch (error) {
    console.error("Failed to generate room opening:", error);
    return getFallbackOpening(roomId);
  }
}

export async function createRoom() {
  const { artistId } = await getArtistId();
  const code = generateRoomCode();

  try {
    const room = await createRoomWithOwner(artistId, code);

    if (!room) throw new Error("Failed to create room");

    redirect(`/room/${room.code}`);
  } catch (err) {
    throw err;
  }
}

const JoinRoomSchema = z.object({
  roomId: z.string().length(6, "Invalid room code"),
});

export async function joinRoomAction(
  prevState: { message: string },
  formData: FormData,
) {
  const { artistId } = await getArtistId();

  const roomId = formData.get("roomId");
  const result = JoinRoomSchema.safeParse({ roomId });

  if (!result.success)
    return {
      message: `Invalid room code`,
    };

  const code = result.data.roomId.toUpperCase();

  try {
    const room = await getRoomJoinInfo(code);

    if (!room) {
      throw new Error("Room not found");
    }

    const artist = await getArtistRoomId(artistId);

    const isAlreadyInRoom = artist?.roomId === room.id;
    const startedAtMs =
      room.status === RoomStatus.ACTIVE && room.expiresAt
        ? room.expiresAt.getTime() - GAME_DURATION_MS
        : null;
    const hasJoinWindowExpired =
      startedAtMs !== null && Date.now() - startedAtMs > LATE_JOIN_WINDOW_MS;

    if (!isAlreadyInRoom && hasJoinWindowExpired) {
      return {
        message: "Room has already started.",
      };
    }

    const joinedArtist = await joinRoomAsArtist(artistId, room.id);

    if (joinedArtist) {
      await publishRoomEvent(code, "artist_joined", joinedArtist);
    }
  } catch (err) {
    console.error("Failed to join room:", err);
    return {
      message: "Failed to join room. Please check the code and try again.",
    };
  }

  redirect(`/room/${code}`);
}

export async function kickPlayerAction(roomId: string, targetArtistId: string) {
  const { artistId: hostId } = await getArtistId();

  const room = await getRoomOwnerId(roomId);

  if (!room || room.ownerId !== hostId) {
    console.error("Unauthorized kick attempt");
    return;
  }

  try {
    await removeArtistFromRoom(targetArtistId);

    await publishRoomEvent(roomId, "artist_left", { id: targetArtistId });
    revalidatePath(`/room/${roomId}`);
  } catch (err) {
    console.error("Failed to kick player:", err);
  }
}

export async function leaveRoomAction() {
  const { artistId } = await getArtistId();

  try {
    const artist = await getArtistRoomCode(artistId);

    await removeArtistFromRoom(artistId);

    if (artist?.room?.code) {
      await publishRoomEvent(artist.room.code, "artist_left", {
        id: artistId,
      });
    }
  } catch {
    return {
      message: "Failed to leave room. Please try again.",
    };
  }

  redirect("/room");
}

async function getHostRoom(roomDatabaseId: string, roomId: string) {
  const { artistId } = await getArtistId();

  const room = await getHostRoomSnapshot(roomDatabaseId);

  if (!room || room.ownerId !== artistId || room.code !== roomId) {
    console.error("Unauthorized room start attempt");
    return null;
  }

  return room;
}

export async function startGameCountdownAction(
  roomDatabaseId: string,
  roomId: string,
) {
  const room = await getHostRoom(roomDatabaseId, roomId);

  if (!room || room.status !== RoomStatus.WAITING || room.startsAt) {
    return;
  }

  const newStartsAt = new Date(Date.now() + 5000);

  await beginStartCountdown(roomDatabaseId, newStartsAt);

  await publishRoomEvent(roomId, "room_updated", {
    startsAt: newStartsAt.toISOString(),
  });
  revalidatePath(`/room/${roomId}`);

  // Generate the topic during the 5s countdown instead of after it, so
  // finalizeGameCountdownAction (which fires the instant the countdown hits
  // zero) doesn't have to wait on the OpenAI round trip before revealing it.
  // after() keeps this running past the response Vercel already sent above.
  after(async () => {
    const roomOpening = await generateRoomOpening(roomId);
    await cacheRoomOpening({
      roomDatabaseId,
      startsAt: newStartsAt,
      introMessage: roomOpening.introMessage,
      theme: roomOpening.topic,
    });
  });
}

export async function cancelGameCountdownAction(
  roomDatabaseId: string,
  roomId: string,
) {
  const room = await getHostRoom(roomDatabaseId, roomId);

  if (!room || room.status !== RoomStatus.WAITING || !room.startsAt) {
    return;
  }

  await cancelStartCountdown(roomDatabaseId, room.startsAt);

  await publishRoomEvent(roomId, "room_updated", { startsAt: null });
  revalidatePath(`/room/${roomId}`);
}

export async function finalizeGameCountdownAction(
  roomDatabaseId: string,
  roomId: string,
): Promise<boolean> {
  const room = await getHostRoom(roomDatabaseId, roomId);

  if (!room || room.status !== RoomStatus.WAITING || !room.startsAt) {
    console.error("Room not found or invalid status for finalizing countdown");
    return false;
  }

  if (room.startsAt.getTime() > Date.now() + 2000) {
    console.error("Countdown has not expired yet for room:", roomId);
    return false;
  }
  // startGameCountdownAction kicks off generation in the background as soon
  // as the countdown begins, so it's usually already cached by now — only
  // fall back to a synchronous call if it hasn't landed yet.
  const roomOpening: RoomOpening =
    room.introMessage && room.theme
      ? { introMessage: room.introMessage, topic: room.theme }
      : await generateRoomOpening(roomId);
  const newStartingExpiresAt = new Date(Date.now() + STARTING_COUNTDOWN_MS);

  const didUpdate = await finalizeStartingCountdown({
    roomDatabaseId,
    previousStartsAt: room.startsAt,
    startingExpiresAt: newStartingExpiresAt,
    introMessage: roomOpening.introMessage,
    theme: roomOpening.topic,
  });

  if (!didUpdate) {
    return false;
  }

  await publishRoomEvent(roomId, "room_updated", {
    status: RoomStatus.STARTING,
    startsAt: null,
    startingExpiresAt: newStartingExpiresAt.toISOString(),
    introMessage: roomOpening.introMessage,
    theme: roomOpening.topic,
  });
  revalidatePath(`/room/${roomId}`);
  return true;
}

export async function activateRoomAction(
  roomDatabaseId: string,
  roomId: string,
) {
  const room = await getRoomActivationSnapshot(roomDatabaseId);

  if (
    !room ||
    room.status !== RoomStatus.STARTING ||
    !room.startingExpiresAt ||
    room.startingExpiresAt.getTime() > Date.now()
  ) {
    return;
  }

  const newExpiresAt = new Date(Date.now() + GAME_DURATION_MS);

  const didUpdate = await activateRoomState({
    roomDatabaseId,
    previousStartingExpiresAt: room.startingExpiresAt,
    expiresAt: newExpiresAt,
  });

  if (!didUpdate) {
    return;
  }

  await publishRoomEvent(roomId, "room_updated", {
    status: RoomStatus.ACTIVE,
    startingExpiresAt: null,
    expiresAt: newExpiresAt.toISOString(),
  });
  revalidatePath(`/room/${roomId}`);
}

export async function finishGameAction(
  roomDatabaseId: string,
  roomId: string,
  artwork: string,
) {
  const { artistId } = await getArtistId();

  const callerInRoom = await isArtistInRoom(artistId, roomDatabaseId);

  if (!callerInRoom) return;

  const ArtworkSchema = z
    .string()
    .startsWith("data:image/png;base64,")
    .max(8000000, "Artwork too large");
  const parsed = ArtworkSchema.safeParse(artwork);

  if (!parsed.success) return;

  const room = await getRoomActivationSnapshot(roomDatabaseId);

  if (!room || room.status !== RoomStatus.ACTIVE || !room.expiresAt) {
    return;
  }

  if (room.expiresAt.getTime() > Date.now()) {
    return;
  }

  const roomWithArtists = await getRoomThemeWithArtistIds(roomDatabaseId);

  if (!roomWithArtists) {
    return;
  }

  let artworkImageUrl: string;
  try {
    artworkImageUrl = await uploadArtworkImage(parsed.data);
  } catch (err) {
    console.error("Failed to upload artwork image:", err);
    return;
  }

  const newArtwork = await createArtworkForRoom({
    roomDatabaseId,
    theme: roomWithArtists.theme ?? "Unknown Theme",
    artworkImage: artworkImageUrl,
    artistIds: roomWithArtists.artists.map((artist) => artist.id),
  });

  if (!newArtwork) {
    console.error(
      "Failed to create artwork record for finished game in room:",
      roomId,
    );
    return;
  }

  revalidatePath(`/room/${roomId}`);
}
