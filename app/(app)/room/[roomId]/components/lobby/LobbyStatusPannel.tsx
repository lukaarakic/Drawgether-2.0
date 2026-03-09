import Text from "@/app/components/Text";
import Image from "next/image";
import CopyIcon from "@/app/assets/misc/copy.svg";
import { useState } from "react";

const LobbyStatusPannel = ({
  isHost,
  roomId,
}: {
  isHost: boolean;
  roomId: string;
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
          <Text
            className="uppercase text-blue! text-[5rem] leading-tight"
            largeShadow
          >
            Lobby code:
          </Text>
          <div className="flex items-center">
            <Text className="text-[5rem] leading-tight" largeShadow>
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
      ) : (
        <Text className="text-blue! text-[5rem]">Waiting for the host...</Text>
      )}
    </>
  );
};

export default LobbyStatusPannel;
