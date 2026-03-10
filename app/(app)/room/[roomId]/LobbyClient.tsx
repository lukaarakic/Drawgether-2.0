"use client";

import Text from "@/app/components/Text";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import Image from "next/image";
import ExitIcon from "@/app/assets/misc/exit.svg";
import { Artist } from "@/app/generated/prisma/client";
import { kickPlayerAction } from "@/app/lib/actions/room";
import LobbyForm from "./components/lobby/LobbyForm";
import LobbyStatusPannel from "./components/lobby/LobbyStatusPannel";
import LobbyStartButton from "./components/lobby/LobbyStartButton";

interface LobbyClientProps {
  roomId: string;
  artists: Artist[];
  currentArtistId: string;
  isHost: boolean;
  roomDatabaseId: string;
}

const MAX_PLAYERS = 5;

const LobbyClient = ({
  roomId,
  artists,
  currentArtistId,
  isHost,
  roomDatabaseId,
}: LobbyClientProps) => {
  const emptySlots = Math.max(0, MAX_PLAYERS - artists.length);

  return (
    <div className="grid grid-cols-2 mt-[3vh] gap-16">
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
          <LobbyStatusPannel isHost={isHost} roomId={roomId} />
        </div>

        <LobbyStartButton
          isHost={isHost}
          roomId={roomId}
          roomDatabaseId={roomDatabaseId}
        />
      </div>
    </div>
  );
};

export default LobbyClient;
