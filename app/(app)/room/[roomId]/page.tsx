import { getArtistId } from "@/app/lib/auth-utils";
import { notFound } from "next/navigation";
import RoomManager from "./RoomManager";
import { db } from "@/app/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room",
  description: "Live room lobby and drawing game.",
};

const Lobby = async ({ params }: { params: Promise<{ roomId: string }> }) => {
  const { roomId } = await params;
  const { artistId } = await getArtistId();

  const room = await db.query.rooms.findFirst({
    where: (r, { eq }) => eq(r.code, roomId),
    with: {
      artists: true,
    },
  });

  if (!room) notFound();

  const isHost = room.ownerId === artistId;

  return (
    <RoomManager
      roomId={room.code}
      roomDatabaseId={room.id}
      initialArtists={room.artists}
      currentArtistId={artistId}
      isHost={isHost}
      initialRoomStatus={room.status}
      initialStartsAt={room.startsAt?.toISOString() ?? null}
      initialStartingExpiresAt={room.startingExpiresAt?.toISOString() ?? null}
      initialIntroMessage={room.introMessage}
      initialTheme={room.theme}
      initialExpiresAt={room.expiresAt?.toISOString() ?? null}
    />
  );
};

export default Lobby;
