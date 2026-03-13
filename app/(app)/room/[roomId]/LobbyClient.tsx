"use client";

import Text from "@/app/components/Text";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import Image from "next/image";
import ExitIcon from "@/app/assets/misc/exit.svg";
import { Artist } from "@/app/generated/prisma/client";
import {
  finalizeGameCountdownAction,
  kickPlayerAction,
} from "@/app/lib/actions/room";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LobbyForm from "./components/lobby/LobbyForm";
import LobbyStatusPannel from "./components/lobby/LobbyStatusPannel";
import LobbyStartButton from "./components/lobby/LobbyStartButton";

interface LobbyClientProps {
  roomId: string;
  artists: Artist[];
  currentArtistId: string;
  isHost: boolean;
  roomDatabaseId: string;
  startsAt: string | null;
}

const MAX_PLAYERS = 5;

const LobbyClient = ({
  roomId,
  artists,
  currentArtistId,
  isHost,
  roomDatabaseId,
  startsAt,
}: LobbyClientProps) => {
  const emptySlots = Math.max(0, MAX_PLAYERS - artists.length);
  const [now, setNow] = useState(() => Date.now());
  const [displayCountdownStartedAt, setDisplayCountdownStartedAt] = useState<
    number | null
  >(null);
  const router = useRouter();
  const finalizedCountdown = useRef<string | null>(null);
  const previousStartsAt = useRef<string | null>(startsAt);
  const countdownEndsAt = startsAt ? new Date(startsAt).getTime() : null;

  const isCountdownActive =
    countdownEndsAt !== null && !Number.isNaN(countdownEndsAt);

  const serverCountdownSeconds = isCountdownActive
    ? Math.max(0, Math.min(5, Math.ceil((countdownEndsAt - now) / 1000)))
    : null;
  const displayCountdownSeconds =
    isCountdownActive && displayCountdownStartedAt !== null
      ? Math.max(0, 5 - Math.floor((now - displayCountdownStartedAt) / 1000))
      : null;
  const countdownSeconds = displayCountdownSeconds ?? serverCountdownSeconds;

  useEffect(() => {
    if (!startsAt) {
      finalizedCountdown.current = null;
      previousStartsAt.current = null;

      const timeoutId = window.setTimeout(() => {
        setDisplayCountdownStartedAt(null);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    if (previousStartsAt.current !== startsAt) {
      const localStart = Date.now();
      const timeoutId = window.setTimeout(() => {
        setDisplayCountdownStartedAt(localStart);
        setNow(localStart);
      }, 0);

      previousStartsAt.current = startsAt;

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    previousStartsAt.current = startsAt;
  }, [startsAt]);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
    };

    const timeoutId = window.setTimeout(tick, 0);

    if (!isCountdownActive) {
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const intervalId = window.setInterval(tick, 250);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [isCountdownActive, startsAt]);

  useEffect(() => {
    if (!isHost || !startsAt || !isCountdownActive) {
      return;
    }

    if (finalizedCountdown.current === startsAt) {
      return;
    }

    const timeRemaining = countdownEndsAt - Date.now();

    const finalize = async () => {
      try {
        await finalizeGameCountdownAction(roomDatabaseId, roomId);
        finalizedCountdown.current = startsAt;
        router.refresh();
      } catch (error) {
        finalizedCountdown.current = null;
        console.error("Failed to finalize game countdown:", error);
      }
    };

    if (timeRemaining <= 0) {
      void finalize();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void finalize();
    }, timeRemaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    countdownEndsAt,
    isCountdownActive,
    isHost,
    roomDatabaseId,
    roomId,
    router,
    startsAt,
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 mt-[3vh] gap-16 px-10">
      <div className="box-shadow bg-pink rotate-2 px-10 py-5 h-fit min-w-2xl max-w-3xl">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="flex items-center gap-2 text-4xl not-last-of-type:border-b border-black first-of-type:pb-5 not-first-of-type:py-10"
          >
            <ArtistCircle username={artist.username} />

            <Text className="text-blue! ml-4">
              {"@".concat(artist.username)}
            </Text>
            {artist.id === currentArtistId && (
              <Text className="uppercase">(YOU)</Text>
            )}

            {isHost && artist.id !== currentArtistId && (
              <form
                className="ml-auto"
                action={kickPlayerAction.bind(null, roomId, artist.id)}
              >
                <button className="cursor-pointer">
                  <Image src={ExitIcon} alt="Exit icon" />
                </button>
              </form>
            )}
          </div>
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-12 not-first-of-type:py-12 justify-center"
          >
            <Text className="uppercase">?</Text>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center mb-40">
        <LobbyForm />

        <div className="mb-8">
          <LobbyStatusPannel
            isHost={isHost}
            roomId={roomId}
            isCountdownActive={isCountdownActive}
            countdownSeconds={countdownSeconds}
          />
        </div>

        <LobbyStartButton
          isHost={isHost}
          roomId={roomId}
          roomDatabaseId={roomDatabaseId}
          isCountdownActive={isCountdownActive}
        />
      </div>
    </div>
  );
};

export default LobbyClient;
