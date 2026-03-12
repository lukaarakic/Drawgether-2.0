"use client";

import LobbyClient from "./LobbyClient";
import { RoomStatus } from "@/app/generated/prisma/enums";
import GameCanvas from "./GameCanvas";
import { Artist } from "@/app/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LobbyStartingPanel from "./components/lobby/LobbyStartingPanel";

interface RoomManagerProps {
  roomId: string;
  roomDatabaseId: string;
  initialArtists: Artist[];
  currentArtistId: string;
  isHost: boolean;
  initialRoomStatus: RoomStatus;
  initialStartsAt: string | null;
}

interface RoomRealtimeState {
  status: RoomStatus;
  startsAt: string | null;
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
  initialStartsAt,
}: RoomManagerProps) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [roomState, setRoomState] = useState<RoomRealtimeState>({
    status: initialRoomStatus,
    startsAt: initialStartsAt,
  });
  const previousRoomStatus = useRef(initialRoomStatus);
  const router = useRouter();

  useEffect(() => {
    setArtists(initialArtists);
  }, [initialArtists]);

  useEffect(() => {
    setRoomState({
      status: initialRoomStatus,
      startsAt: initialStartsAt,
    });
  }, [initialRoomStatus, initialStartsAt]);

  useEffect(() => {
    if (
      roomState.status === RoomStatus.STARTING &&
      previousRoomStatus.current !== RoomStatus.STARTING
    ) {
      router.refresh();
    }

    previousRoomStatus.current = roomState.status;
  }, [roomState.status, router]);

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
          const updatedRoom = payload.new as {
            status: RoomStatus;
            startsAt: string | null;
          };

          setRoomState({
            status: updatedRoom.status as RoomStatus,
            startsAt: updatedRoom.startsAt ?? null,
          });
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
      {roomState.status === RoomStatus.WAITING && (
        <LobbyClient
          roomId={roomId}
          roomDatabaseId={roomDatabaseId}
          artists={artists}
          currentArtistId={currentArtistId}
          isHost={isHost}
          startsAt={roomState.startsAt}
        />
      )}

      {roomState.status === RoomStatus.STARTING && <LobbyStartingPanel />}

      {roomState.status === RoomStatus.ACTIVE && (
        <GameCanvas artists={artists} roomId={roomId} />
      )}
    </>
  );
};

export default RoomManager;
