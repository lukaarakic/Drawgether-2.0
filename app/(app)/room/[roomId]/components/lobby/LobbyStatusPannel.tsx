import Text from "@/app/components/Text";
import Image from "next/image";
import CopyIcon from "@/app/assets/misc/copy.svg";
import { useState } from "react";

const LobbyStatusPannel = ({
  isHost,
  roomId,
  isCountdownActive,
  countdownSeconds,
}: {
  isHost: boolean;
  roomId: string;
  isCountdownActive: boolean;
  countdownSeconds: number | null;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(roomId)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy!", err);
        });
    } else {
      console.warn("Clipboard API not available");
    }
  };

  return (
    <>
      {isHost ? (
        <>
          {isCountdownActive && countdownSeconds !== null && (
            <>
              <Text className="uppercase text-blue! text-40 leading-tight">
                Starting in:
              </Text>
              <Text className="text-60 leading-none mb-4">
                {countdownSeconds}
              </Text>
            </>
          )}

          {!isCountdownActive && (
            <>
              <Text className="uppercase text-blue! text-[5rem] leading-tight">
                Lobby code:
              </Text>
              <div className="flex items-center">
                <Text className="text-[5rem] leading-tight">
                  {"#".concat(roomId)}
                </Text>
                <button onClick={handleCopyCode} aria-label="Copy lobby code">
                  {copied ? (
                    <Text className="text-20 ml-4 text-blue!">Copied!</Text>
                  ) : (
                    <Image
                      src={CopyIcon}
                      alt="Copy icon"
                      className="inline-block ml-4 cursor-pointer"
                    />
                  )}
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <Text className="text-blue! text-40" largeShadow>
            {isCountdownActive
              ? "Game starts in..."
              : "Waiting for the host..."}
          </Text>

          {isCountdownActive && countdownSeconds !== null && (
            <Text className="text-40 leading-none mt-4" largeShadow>
              {countdownSeconds}
            </Text>
          )}
        </>
      )}
    </>
  );
};

export default LobbyStatusPannel;
