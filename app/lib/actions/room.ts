"use server";

import { generateRoomCode } from "@/app/utils/misc";
import { getArtistId } from "../auth-utils";
import prisma from "../db";
import { redirect } from "next/navigation";
import z from "zod";
import { revalidatePath } from "next/cache";
import { RoomStatus } from "@/app/generated/prisma/enums";

export async function createRoom() {
  const { artistId } = await getArtistId();
  const code = generateRoomCode();

  try {
    const room = await prisma.room.create({
      data: {
        code,
        ownerId: artistId,
        artists: { connect: { id: artistId } },
      },
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
    await prisma.room.update({
      where: { code },
      data: {
        artists: {
          connect: { id: artistId },
        },
      },
    });
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

  const room = await prisma.room.findUnique({
    where: { code: roomId },
    select: { ownerId: true },
  });

  if (!room || room.ownerId !== hostId) {
    console.error("Unauthorized kick attempt");
    return;
  }

  try {
    await prisma.room.update({
      where: { code: roomId },
      data: {
        artists: {
          disconnect: { id: targetArtistId },
        },
      },
    });

    revalidatePath(`/room/${roomId}`);
  } catch (err) {
    console.error("Failed to kick player:", err);
  }
}

export async function leaveRoomAction() {
  const { artistId } = await getArtistId();

  try {
    await prisma.artist.update({
      where: { id: artistId },
      data: {
        roomId: null,
      },
    });
  } catch {
    return {
      message: "Failed to leave room. Please try again.",
    };
  }

  redirect("/room");
}

async function getHostRoom(roomDatabaseId: string, roomId: string) {
  const { artistId } = await getArtistId();

  const room = await prisma.room.findUnique({
    where: { id: roomDatabaseId },
    select: {
      ownerId: true,
      code: true,
      status: true,
      startsAt: true,
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

  await prisma.room.updateMany({
    where: {
      id: roomDatabaseId,
      status: RoomStatus.WAITING,
      startsAt: null,
    },
    data: {
      startsAt: new Date(Date.now() + 5000),
    },
  });

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

  await prisma.room.updateMany({
    where: {
      id: roomDatabaseId,
      status: RoomStatus.WAITING,
      startsAt: room.startsAt,
    },
    data: {
      startsAt: null,
    },
  });

  revalidatePath(`/room/${roomId}`);
}

export async function finalizeGameCountdownAction(
  roomDatabaseId: string,
  roomId: string,
) {
  const room = await getHostRoom(roomDatabaseId, roomId);

  if (!room || room.status !== RoomStatus.WAITING || !room.startsAt) {
    return;
  }

  if (room.startsAt.getTime() > Date.now()) {
    return;
  }

  const result = await prisma.room.updateMany({
    where: {
      id: roomDatabaseId,
      status: RoomStatus.WAITING,
      startsAt: room.startsAt,
    },
    data: {
      status: RoomStatus.STARTING,
      startsAt: null,
    },
  });

  if (!result.count) {
    return;
  }

  revalidatePath(`/room/${roomId}`);
}
