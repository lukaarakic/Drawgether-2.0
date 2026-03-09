import { useTransition } from "react";
import { startGameAction } from "@/app/lib/actions/room";
import LeaveButton from "./LeaveButton";

const LobbyStartButton = ({
  isHost,
  roomId,
  roomDatabaseId,
}: {
  isHost: boolean;
  roomId: string;
  roomDatabaseId: string;
}) => {
  const [isStarting, startTransition] = useTransition();

  return (
    <>
      {isHost ? (
        <button
          disabled={isStarting}
          onClick={() => {
            startTransition(() => {
              startGameAction(roomDatabaseId, roomId);
            });
          }}
          className="cursor-pointer box-shadow flex aspect-square px-10 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90"
        >
          <div className="rotate-10 text-7xl text-white">Start</div>
        </button>
      ) : (
        <LeaveButton />
      )}
    </>
  );
};

export default LobbyStartButton;
