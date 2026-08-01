import { getArtistId } from "@/app/lib/auth-utils";
import { notFound } from "next/navigation";
import RoomManager from "./RoomManager";
import { getRoomForLobby } from "@/app/lib/data/rooms";
import type { Metadata } from "next";
import { RoomStatus } from "@/drizzle/types";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Room",
  description: "Live room lobby and drawing game.",
};

const Lobby = async ({ params }: { params: Promise<{ roomId: string }> }) => {
  const { roomId } = await params;
  const { artistId } = await getArtistId();

  const room = await getRoomForLobby(roomId);

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
