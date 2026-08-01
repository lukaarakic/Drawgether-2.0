import { Query } from "node-appwrite";
import { createId } from "@paralleldrive/cuid2";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { RoomStatus } from "@/drizzle/types";
import { TABLES } from "./tables";
import { mapArtist, mapRoom } from "./appwrite-mappers";

export async function createRoomWithOwner(ownerId: string, code: string) {
  const roomId = createId();

  const transaction = await tablesDB.createTransaction();
  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.rooms,
      rowId: roomId,
      data: { code, ownerId, status: RoomStatus.WAITING },
      transactionId: transaction.$id,
    });

    await tablesDB.updateRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: ownerId,
      data: { roomId },
      transactionId: transaction.$id,
    });

    await tablesDB.updateTransaction({ transactionId: transaction.$id, commit: true });
  } catch (err) {
    await tablesDB
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => {});
    throw err;
  }

  const room = await tablesDB.getRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    rowId: roomId,
  });

  return mapRoom(room);
}

export async function getRoomForLobby(code: string) {
  const { rows: roomRows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    queries: [Query.equal("code", code), Query.limit(1)],
  });

  const roomRow = roomRows[0];
  if (!roomRow) return undefined;

  const { rows: artistRows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.equal("roomId", roomRow.$id), Query.limit(1000)],
  });

  return {
    ...mapRoom(roomRow),
    artists: artistRows.map(mapArtist),
  };
}

export async function getRoomJoinInfo(code: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    queries: [Query.equal("code", code), Query.limit(1)],
  });

  const row = rows[0];
  if (!row) return undefined;

  const mapped = mapRoom(row);
  return { id: mapped.id, status: mapped.status, expiresAt: mapped.expiresAt };
}

export async function getArtistRoomId(artistId: string) {
  try {
    const row = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: artistId,
    });
    return { roomId: (row.roomId as string) ?? null };
  } catch {
    return undefined;
  }
}

export async function joinRoomAsArtist(artistId: string, roomDatabaseId: string) {
  const row = await tablesDB.updateRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    rowId: artistId,
    data: { roomId: roomDatabaseId },
  });

  return mapArtist(row);
}

export async function getRoomOwnerId(code: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    queries: [Query.equal("code", code), Query.limit(1)],
  });

  const row = rows[0];
  if (!row) return undefined;

  return { ownerId: row.ownerId as string };
}

export async function removeArtistFromRoom(artistId: string) {
  await tablesDB.updateRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    rowId: artistId,
    data: { roomId: null },
  });
}

export async function getArtistRoomCode(artistId: string) {
  let artist;
  try {
    artist = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: artistId,
    });
  } catch {
    return undefined;
  }

  const roomId = artist.roomId as string | null;
  if (!roomId) return { roomId: null, room: null };

  const room = await tablesDB.getRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    rowId: roomId,
  });

  return { roomId, room: { code: room.code as string } };
}

export async function getHostRoomSnapshot(roomDatabaseId: string) {
  try {
    const row = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.rooms,
      rowId: roomDatabaseId,
    });
    return mapRoom(row);
  } catch {
    return undefined;
  }
}

export async function beginStartCountdown(roomDatabaseId: string, startsAt: Date) {
  await tablesDB.updateRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    data: { startsAt: startsAt.toISOString() },
    queries: [
      Query.equal("$id", roomDatabaseId),
      Query.equal("status", RoomStatus.WAITING),
      Query.isNull("startsAt"),
    ],
  });
}

export async function cacheRoomOpening({
  roomDatabaseId,
  startsAt,
  introMessage,
  theme,
}: {
  roomDatabaseId: string;
  startsAt: Date;
  introMessage: string;
  theme: string;
}) {
  await tablesDB.updateRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    data: { introMessage, theme },
    queries: [
      Query.equal("$id", roomDatabaseId),
      Query.equal("status", RoomStatus.WAITING),
      Query.equal("startsAt", startsAt.toISOString()),
    ],
  });
}

export async function cancelStartCountdown(
  roomDatabaseId: string,
  previousStartsAt: Date,
) {
  await tablesDB.updateRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    data: { startsAt: null },
    queries: [
      Query.equal("$id", roomDatabaseId),
      Query.equal("status", RoomStatus.WAITING),
      Query.equal("startsAt", previousStartsAt.toISOString()),
    ],
  });
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
  const { total } = await tablesDB.updateRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    data: {
      status: RoomStatus.STARTING,
      startsAt: null,
      startingExpiresAt: startingExpiresAt.toISOString(),
      introMessage,
      theme,
    },
    queries: [
      Query.equal("$id", roomDatabaseId),
      Query.equal("status", RoomStatus.WAITING),
      Query.equal("startsAt", previousStartsAt.toISOString()),
    ],
  });

  return !!total;
}

export async function getRoomActivationSnapshot(roomDatabaseId: string) {
  try {
    const row = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.rooms,
      rowId: roomDatabaseId,
    });
    const mapped = mapRoom(row);
    return {
      status: mapped.status,
      startingExpiresAt: mapped.startingExpiresAt,
      expiresAt: mapped.expiresAt,
    };
  } catch {
    return undefined;
  }
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
  const { total } = await tablesDB.updateRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.rooms,
    data: {
      status: RoomStatus.ACTIVE,
      startingExpiresAt: null,
      expiresAt: expiresAt.toISOString(),
    },
    queries: [
      Query.equal("$id", roomDatabaseId),
      Query.equal("status", RoomStatus.STARTING),
      Query.equal("startingExpiresAt", previousStartingExpiresAt.toISOString()),
    ],
  });

  return !!total;
}

export async function isArtistInRoom(artistId: string, roomDatabaseId: string) {
  try {
    const row = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: artistId,
    });
    return row.roomId === roomDatabaseId;
  } catch {
    return false;
  }
}

export async function getRoomThemeWithArtistIds(roomDatabaseId: string) {
  let room;
  try {
    room = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.rooms,
      rowId: roomDatabaseId,
    });
  } catch {
    return undefined;
  }

  const { rows: artistRows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.equal("roomId", roomDatabaseId), Query.limit(1000)],
  });

  return {
    theme: (room.theme as string) ?? null,
    artists: artistRows.map((row) => ({ id: row.$id as string })),
  };
}
