"use client";

import LobbyClient from "./LobbyClient";
import GameCanvas from "./GameCanvas";
import { RoomSocket } from "@/app/lib/realtime-client";
import { mintRealtimeToken } from "@/app/lib/actions/realtime-token";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LobbyStartingPanel from "@/app/(app)/room/[roomId]/LobbyStartingPanel";
import { activateRoomAction } from "@/app/lib/actions/room";
import { Artist } from "@/drizzle/schema";
import { RoomStatus } from "@/drizzle/types";
import { useLeaveGameConfirm } from "./hooks/useLeaveGameConfirm";
import { useNavbar } from "@/app/context/NavbarContext";

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

function mergeRoomState(
  previous: RoomRealtimeState,
  payload: Partial<RoomRealtimeState>,
): RoomRealtimeState {
  return { ...previous, ...payload };
}

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

  const [socket, setSocket] = useState<RoomSocket | null>(null);

  useEffect(() => {
    const socket = new RoomSocket(
      process.env.NEXT_PUBLIC_REALTIME_WS_URL!,
      roomId,
      () => mintRealtimeToken(roomId),
    );
    setSocket(socket);

    const unsubscribers = [
      socket.on("artist_joined", (payload) => {
        const artist = payload as Artist;
        setArtists((prev) => {
          if (prev.some((existing) => existing.id === artist.id)) {
            return prev.map((existing) =>
              existing.id === artist.id ? artist : existing,
            );
          }
          return [...prev, artist];
        });
      }),
      socket.on("artist_left", (payload) => {
        const { id } = payload as { id: string };
        setArtists((prev) => prev.filter((artist) => artist.id !== id));

        if (id === currentArtistId) {
          router.push("/room");
          router.refresh();
        }
      }),
      socket.on("room_updated", (payload) => {
        setRoomState((previous) =>
          mergeRoomState(previous, payload as Partial<RoomRealtimeState>),
        );
      }),
    ];

    void socket.connect();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      socket.close();
      setSocket(null);
    };
  }, [currentArtistId, roomId, router]);

  const { setHidden } = useNavbar();
  useEffect(() => {
    const shouldHide =
      roomState.status === RoomStatus.ACTIVE ||
      roomState.status === RoomStatus.STARTING;
    setHidden(shouldHide);

    return () => setHidden(false);
  }, [roomState.status, setHidden]);

  const isGameActive = roomState.status === RoomStatus.ACTIVE;
  useLeaveGameConfirm(isGameActive);

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

      {roomState.status === RoomStatus.ACTIVE && socket && (
        <GameCanvas
          artists={artists}
          roomId={roomId}
          theme={roomState.theme}
          expiresAt={roomState.expiresAt}
          roomDatabaseId={roomDatabaseId}
          socket={socket}
        />
      )}
    </>
  );
};

export default RoomManager;
