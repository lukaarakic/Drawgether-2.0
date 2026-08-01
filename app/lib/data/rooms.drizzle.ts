import { db } from "../db";
import { artists, rooms } from "@/drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { RoomStatus } from "@/drizzle/types";

export async function createRoomWithOwner(ownerId: string, code: string) {
  return db.transaction(async (tx) => {
    const [room] = await tx
      .insert(rooms)
      .values({ code, ownerId })
      .returning();

    await tx
      .update(artists)
      .set({ roomId: room.id })
      .where(eq(artists.id, ownerId));

    return room;
  });
}

export async function getRoomForLobby(code: string) {
  return db.query.rooms.findFirst({
    where: (room, { eq }) => eq(room.code, code),
    with: { artists: true },
  });
}

export async function getRoomJoinInfo(code: string) {
  return db.query.rooms.findFirst({
    where: eq(rooms.code, code),
    columns: { id: true, status: true, expiresAt: true },
  });
}

export async function getArtistRoomId(artistId: string) {
  return db.query.artists.findFirst({
    where: eq(artists.id, artistId),
    columns: { roomId: true },
  });
}

export async function joinRoomAsArtist(artistId: string, roomDatabaseId: string) {
  const [joinedArtist] = await db
    .update(artists)
    .set({ roomId: roomDatabaseId })
    .where(eq(artists.id, artistId))
    .returning();

  return joinedArtist;
}

export async function getRoomOwnerId(code: string) {
  return db.query.rooms.findFirst({
    where: eq(rooms.code, code),
    columns: { ownerId: true },
  });
}

export async function removeArtistFromRoom(artistId: string) {
  await db
    .update(artists)
    .set({ roomId: null })
    .where(eq(artists.id, artistId));
}

export async function getArtistRoomCode(artistId: string) {
  return db.query.artists.findFirst({
    where: eq(artists.id, artistId),
    columns: { roomId: true },
    with: { room: { columns: { code: true } } },
  });
}

export async function getHostRoomSnapshot(roomDatabaseId: string) {
  return db.query.rooms.findFirst({
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
}

export async function beginStartCountdown(roomDatabaseId: string, startsAt: Date) {
  await db
    .update(rooms)
    .set({ startsAt })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.WAITING),
        isNull(rooms.startsAt),
      ),
    );
}

export async function cancelStartCountdown(
  roomDatabaseId: string,
  previousStartsAt: Date,
) {
  await db
    .update(rooms)
    .set({ startsAt: null })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.WAITING),
        eq(rooms.startsAt, previousStartsAt),
      ),
    );
}

export async function finalizeStartingCountdown({
  roomDatabaseId,
  previousStartsAt,
  startingExpiresAt,
  introMessage,
  theme,
}: {
  roomDatabaseId: string;
  previousStartsAt: Date;
  startingExpiresAt: Date;
  introMessage: string;
  theme: string;
}): Promise<boolean> {
  const result = await db
    .update(rooms)
    .set({
      status: RoomStatus.STARTING,
      startsAt: null,
      startingExpiresAt,
      introMessage,
      theme,
    })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.WAITING),
        eq(rooms.startsAt, previousStartsAt),
      ),
    );

  return !!result.count;
}

export async function getRoomActivationSnapshot(roomDatabaseId: string) {
  return db.query.rooms.findFirst({
    where: eq(rooms.id, roomDatabaseId),
    columns: { status: true, startingExpiresAt: true, expiresAt: true },
  });
}

export async function activateRoomState({
  roomDatabaseId,
  previousStartingExpiresAt,
  expiresAt,
}: {
  roomDatabaseId: string;
  previousStartingExpiresAt: Date;
  expiresAt: Date;
}): Promise<boolean> {
  const result = await db
    .update(rooms)
    .set({
      status: RoomStatus.ACTIVE,
      startingExpiresAt: null,
      expiresAt,
    })
    .where(
      and(
        eq(rooms.id, roomDatabaseId),
        eq(rooms.status, RoomStatus.STARTING),
        eq(rooms.startingExpiresAt, previousStartingExpiresAt),
      ),
    );

  return !!result.count;
}

export async function isArtistInRoom(artistId: string, roomDatabaseId: string) {
  const artist = await db.query.artists.findFirst({
    where: and(eq(artists.id, artistId), eq(artists.roomId, roomDatabaseId)),
    columns: { id: true },
  });

  return !!artist;
}

export async function getRoomThemeWithArtistIds(roomDatabaseId: string) {
  return db.query.rooms.findFirst({
    where: eq(rooms.id, roomDatabaseId),
    columns: { theme: true },
    with: { artists: { columns: { id: true } } },
  });
}
