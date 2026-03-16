import { FC } from "react";
import Image from "next/image";

interface ArtistCircleProps {
  username: string;
  className?: string;
  size?: "small" | "medium" | "large";
  avatarUrl?: string | null;
}

const ArtistCircle: FC<ArtistCircleProps> = ({
  username,
  className,
  avatarUrl,
  size = "medium",
}) => {
  const avatarSrc =
    avatarUrl ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${username || "default"}`;

  return (
    <div
      className={`${className || ""} ${size === "small" ? "w-24 h-24" : size === "large" ? "w-50 h-50" : "w-30 h-30"} box-shadow flex items-center justify-center overflow-hidden rounded-full bg-white`}
    >
      <Image
        src={avatarSrc}
        alt={`${username || "default"} avatar`}
        width={size === "small" ? 48 : size === "large" ? 272 : 60}
        height={size === "small" ? 48 : size === "large" ? 272 : 60}
        unoptimized
      />
    </div>
  );
};

export default ArtistCircle;
