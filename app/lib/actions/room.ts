"use server";

import { generateRoomCode } from "@/app/utils/misc";
import { getArtistId } from "../auth-utils";
import { redirect } from "next/navigation";
import z from "zod";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { db } from "../db";
import { artists, artistsArtworks, artworks, rooms } from "@/drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { RoomStatus } from "@/drizzle/types";

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
    const room = await db.transaction(async (tx) => {
      const [room] = await tx
        .insert(rooms)
        .values({
          code,
          ownerId: artistId,
        })
        .returning();

      await tx
        .update(artists)
        .set({ roomId: room.id })
        .where(eq(artists.id, artistId));

      return room;
    });

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
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.code, code),
      columns: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!room) {
      throw new Error("Room not found");
    }

    const artist = await db.query.artists.findFirst({
      where: eq(artists.id, artistId),
      columns: {
        roomId: true,
      },
    });

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

    await db
      .update(artists)
      .set({ roomId: room.id })
      .where(eq(artists.id, artistId));
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

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, roomId),
    columns: {
      ownerId: true,
    },
  });

  if (!room || room.ownerId !== hostId) {
    console.error("Unauthorized kick attempt");
    return;
  }

  try {
    await db
      .update(artists)
      .set({ roomId: null })
      .where(eq(artists.id, targetArtistId));

    revalidatePath(`/room/${roomId}`);
  } catch (err) {
    console.error("Failed to kick player:", err);
  }
}

export async function leaveRoomAction() {
  const { artistId } = await getArtistId();

  try {
    await db
      .update(artists)
      .set({ roomId: null })
      .where(eq(artists.id, artistId));
  } catch {
    return {
      message: "Failed to leave room. Please try again.",
    };
  }

  redirect("/room");
}

async function getHostRoom(roomDatabaseId: string, roomId: string) {
  const { artistId } = await getArtistId();

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomDatabaseId),
    columns: {
      ownerId: true,
      code: true,
      status: true,
      startsAt: true,
      startingExpiresAt: true,
      introMessage: true,
      theme: true,
      expiresAt: true,
    },
  });

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

  await db
    .update(rooms)
    .set({
      startsAt: new Date(Date.now() + 5000),
    })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.WAITING),
        isNull(rooms.startsAt),
      ),
    );

  revalidatePath(`/room/${roomId}`);
}

export async function cancelGameCountdownAction(
  roomDatabaseId: string,
  roomId: string,
) {
  const room = await getHostRoom(roomDatabaseId, roomId);

  if (!room || room.status !== RoomStatus.WAITING || !room.startsAt) {
    return;
  }

  await db
    .update(rooms)
    .set({
      startsAt: null,
    })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.WAITING),
        eq(rooms.startsAt, room.startsAt),
      ),
    );

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
  const roomOpening = await generateRoomOpening(roomId);

  const result = await db
    .update(rooms)
    .set({
      status: RoomStatus.STARTING,
      startsAt: null,
      startingExpiresAt: new Date(Date.now() + STARTING_COUNTDOWN_MS),
      introMessage: roomOpening.introMessage,
      theme: roomOpening.topic,
    })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.WAITING),
        eq(rooms.startsAt, room.startsAt),
      ),
    );

  if (!result.count) {
    return false;
  }

  revalidatePath(`/room/${roomId}`);
  return true;
}

export async function activateRoomAction(
  roomDatabaseId: string,
  roomId: string,
) {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomDatabaseId),
    columns: {
      status: true,
      startingExpiresAt: true,
      expiresAt: true,
    },
  });

  if (
    !room ||
    room.status !== RoomStatus.STARTING ||
    !room.startingExpiresAt ||
    room.startingExpiresAt.getTime() > Date.now()
  ) {
    return;
  }

  const result = await db
    .update(rooms)
    .set({
      status: RoomStatus.ACTIVE,
      startingExpiresAt: null,
      expiresAt: new Date(Date.now() + GAME_DURATION_MS),
    })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.STARTING),
        eq(rooms.startingExpiresAt, room.startingExpiresAt),
      ),
    );

  if (!result.count) {
    return;
  }

  revalidatePath(`/room/${roomId}`);
}

export async function finishGameAction(
  roomDatabaseId: string,
  roomId: string,
  artwork: string,
) {
  const { artistId } = await getArtistId();

  const caller = await db.query.artists.findFirst({
    where: and(eq(artists.id, artistId), eq(artists.roomId, roomDatabaseId)),
    columns: { id: true },
  });

  if (!caller) return;

  const ArtworkSchema = z
    .string()
    .startsWith("data:image/png;base64,")
    .max(8000000, "Artwork too large");
  const parsed = ArtworkSchema.safeParse(artwork);

  if (!parsed.success) return;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomDatabaseId),
    columns: {
      status: true,
      startingExpiresAt: true,
      expiresAt: true,
    },
  });

  if (!room || room.status !== RoomStatus.ACTIVE || !room.expiresAt) {
    return;
  }

  if (room.expiresAt.getTime() > Date.now()) {
    return;
  }

  const roomWithArtists = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomDatabaseId),
    columns: {
      theme: true,
    },
    with: {
      artists: {
        columns: {
          id: true,
        },
      },
    },
  });

  if (!roomWithArtists) {
    return;
  }

  const newArtwork = await db.transaction(async (tx) => {
    const [createdArtwork] = await tx
      .insert(artworks)
      .values({
        artworkImage: parsed.data,
        roomId: roomDatabaseId,
        theme: roomWithArtists.theme ?? "Unknown Theme",
      })
      .returning();

    const artistConnections = roomWithArtists.artists.map((artist) => ({
      artworkId: createdArtwork.id,
      artistId: artist.id,
    }));

    if (artistConnections.length > 0) {
      await tx.insert(artistsArtworks).values(artistConnections);
    }

    return createdArtwork;
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
