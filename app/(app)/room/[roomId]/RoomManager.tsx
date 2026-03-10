"use client";

import LobbyClient from "./LobbyClient";
import { RoomStatus } from "@/app/generated/prisma/enums";
import GameCanvas from "./GameCanvas";
import { Artist, Room } from "@/app/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoomManagerProps {
  roomId: string;
  roomDatabaseId: string;
  initialArtists: Artist[];
  currentArtistId: string;
  isHost: boolean;
  initialRoomStatus: RoomStatus;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const RoomManager = ({
  roomId,
  roomDatabaseId,
  initialArtists,
  currentArtistId,
  isHost,
  initialRoomStatus,
}: RoomManagerProps) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [roomStatus, setRoomStatus] = useState(initialRoomStatus);
  const router = useRouter();

  useEffect(() => {
    setArtists(initialArtists);
  }, [initialArtists]);

  useEffect(() => {
    setRoomStatus(initialRoomStatus);
  }, [initialRoomStatus]);

  useEffect(() => {
    const roomArtistsChannel = supabase.channel(`room_${roomId}`);

    roomArtistsChannel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Artist",
        },
        (payload) => {
          setArtists((prev) => {
            const updatedArtist = payload.new as Artist;

            if (payload.eventType === "DELETE") {
              return prev.filter((artist) => artist.id !== payload.old.id);
            }

            if (
              !updatedArtist.roomId ||
              updatedArtist.roomId !== roomDatabaseId
            ) {
              return prev.filter((artist) => artist.id !== updatedArtist.id);
            }

            const alreadyInRoom = prev.some(
              (artist) => artist.id === updatedArtist.id,
            );

            if (alreadyInRoom) {
              return prev.map((artist) =>
                artist.id === updatedArtist.id ? updatedArtist : artist,
              );
            }

            return [...prev, updatedArtist];
          });
        },
      )
      .subscribe();

    const personalChannel = supabase.channel(`kick_check_${currentArtistId}`);
    personalChannel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Artist",
          filter: `id=eq.${currentArtistId}`,
        },
        (payload) => {
          const updatedArtist = payload.new as Artist;

          if (!updatedArtist.roomId) {
            router.push("/room");
            router.refresh();
          }
        },
      )
      .subscribe();

    const roomStatusChannel = supabase.channel(`room_status_${roomDatabaseId}`);
    roomStatusChannel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomDatabaseId}`,
        },
        (payload) => {
          const updatedRoom = payload.new as Room;
          setRoomStatus(updatedRoom.status as RoomStatus);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomArtistsChannel);
      supabase.removeChannel(personalChannel);
      supabase.removeChannel(roomStatusChannel);
    };
  }, [currentArtistId, roomDatabaseId, roomId, router]);

  return (
    <>
      {roomStatus === RoomStatus.WAITING && (
        <LobbyClient
          roomId={roomId}
          roomDatabaseId={roomDatabaseId}
          artists={artists}
          currentArtistId={currentArtistId}
          isHost={isHost}
        />
      )}

      {roomStatus === RoomStatus.ACTIVE && <GameCanvas roomId={roomId} />}
    </>
  );
};

export default RoomManager;
