import { useState } from "react";
import {
  cancelGameCountdownAction,
  startGameCountdownAction,
} from "@/app/lib/actions/room";
import LeaveButton from "./LeaveButton";

const LobbyStartButton = ({
  isHost,
  roomId,
  roomDatabaseId,
  isCountdownActive,
}: {
  isHost: boolean;
  roomId: string;
  roomDatabaseId: string;
  isCountdownActive: boolean;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isCountdownActive) {
        await cancelGameCountdownAction(roomDatabaseId, roomId);
        return;
      }

      await startGameCountdownAction(roomDatabaseId, roomId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isHost ? (
        <button
          disabled={isSubmitting}
          onClick={handleClick}
          className={`cursor-pointer box-shadow flex aspect-square px-10 items-center justify-center rounded-full uppercase transition-transform hover:scale-105 active:scale-90 ${
            isCountdownActive ? "bg-blue" : "bg-pink"
          } ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}
        >
          <div className="rotate-10 text-7xl text-white">
            {isCountdownActive ? "Cancel" : "Start"}
          </div>
        </button>
      ) : (
        <LeaveButton />
      )}
    </>
  );
};

export default LobbyStartButton;
