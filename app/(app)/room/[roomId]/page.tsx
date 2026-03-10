import { getArtistId } from "@/app/lib/auth-utils";
import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";
import RoomManager from "./RoomManager";

const Lobby = async ({ params }: { params: Promise<{ roomId: string }> }) => {
  const { roomId } = await params;
  const { artistId } = await getArtistId();

  const room = await prisma.room.findUnique({
    where: {
      code: roomId,
    },
    include: {
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
    />
  );
};

export default Lobby;
