"use client";

import LobbyClient from "./LobbyClient";
import GameCanvas from "./GameCanvas";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LobbyStartingPanel from "@/app/(app)/room/[roomId]/LobbyStartingPanel";
import { activateRoomAction } from "@/app/lib/actions/room";
import { Artist } from "@/drizzle/schema";
import { RoomStatus } from "@/drizzle/types";

interface RoomManagerProps {
  roomId: string;
  roomDatabaseId: string;
  initialArtists: Artist[];
  currentArtistId: string;
  isHost: boolean;
  initialRoomStatus: RoomStatus;
  initialStartsAt: string | null;
  initialStartingExpiresAt: string | null;
  initialIntroMessage: string | null;
  initialTheme: string | null;
  initialExpiresAt: string | null;
}

interface RoomRealtimeState {
  status: RoomStatus;
  startsAt: string | null;
  startingExpiresAt: string | null;
  introMessage: string | null;
  theme: string | null;
  expiresAt: string | null;
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
  initialStartingExpiresAt,
  initialIntroMessage,
  initialTheme,
  initialExpiresAt,
}: RoomManagerProps) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [now, setNow] = useState(() => Date.now());
  const [roomState, setRoomState] = useState<RoomRealtimeState>({
    status: initialRoomStatus,
    startsAt: initialStartsAt,
    startingExpiresAt: initialStartingExpiresAt,
    introMessage: initialIntroMessage,
    theme: initialTheme,
    expiresAt: initialExpiresAt,
  });
  const previousRoomStatus = useRef(initialRoomStatus);
  const activatedStartingCountdown = useRef<string | null>(null);
  const router = useRouter();
  const startingEndsAt = roomState.startingExpiresAt
    ? new Date(roomState.startingExpiresAt).getTime()
    : null;
  const isStartingCountdownActive =
    startingEndsAt !== null && !Number.isNaN(startingEndsAt);
  const startingCountdownSeconds = isStartingCountdownActive
    ? Math.max(0, Math.ceil((startingEndsAt - now) / 1000))
    : 0;

  useEffect(() => {
    setArtists(initialArtists);
  }, [initialArtists]);

  useEffect(() => {
    setRoomState({
      status: initialRoomStatus,
      startsAt: initialStartsAt,
      startingExpiresAt: initialStartingExpiresAt,
      introMessage: initialIntroMessage,
      theme: initialTheme,
      expiresAt: initialExpiresAt,
    });
  }, [
    initialIntroMessage,
    initialRoomStatus,
    initialStartingExpiresAt,
    initialStartsAt,
    initialTheme,
    initialExpiresAt,
  ]);

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
    if (roomState.status !== RoomStatus.STARTING) {
      activatedStartingCountdown.current = null;
      return;
    }

    const tick = () => {
      setNow(Date.now());
    };

    tick();

    const intervalId = window.setInterval(tick, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roomState.status]);

  useEffect(() => {
    if (
      !isHost ||
      roomState.status !== RoomStatus.STARTING ||
      !roomState.startingExpiresAt ||
      !isStartingCountdownActive
    ) {
      return;
    }

    if (activatedStartingCountdown.current === roomState.startingExpiresAt) {
      return;
    }

    const timeRemaining = startingEndsAt - Date.now();

    const activate = async () => {
      try {
        await activateRoomAction(roomDatabaseId, roomId);
        activatedStartingCountdown.current = roomState.startingExpiresAt;
        router.refresh();
      } catch (error) {
        console.error("Failed to activate room:", error);
      }
    };

    if (timeRemaining <= 0) {
      void activate();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void activate();
    }, timeRemaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isHost,
    isStartingCountdownActive,
    roomDatabaseId,
    roomId,
    roomState.startingExpiresAt,
    roomState.status,
    router,
    startingEndsAt,
  ]);

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
            startingExpiresAt: string | null;
            introMessage: string | null;
            theme: string | null;
            expiresAt: string | null;
          };

          setRoomState({
            status: updatedRoom.status as RoomStatus,
            startsAt: updatedRoom.startsAt ?? null,
            startingExpiresAt: updatedRoom.startingExpiresAt ?? null,
            introMessage: updatedRoom.introMessage ?? null,
            theme: updatedRoom.theme ?? null,
            expiresAt: updatedRoom.expiresAt ?? null,
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

      {roomState.status === RoomStatus.STARTING && (
        <LobbyStartingPanel
          introMessage={roomState.introMessage}
          theme={roomState.theme}
          countdownSeconds={startingCountdownSeconds}
        />
      )}

      {roomState.status === RoomStatus.ACTIVE && (
        <GameCanvas
          artists={artists}
          roomId={roomId}
          theme={roomState.theme}
          expiresAt={roomState.expiresAt}
          roomDatabaseId={roomDatabaseId}
        />
      )}
    </>
  );
};

export default RoomManager;
