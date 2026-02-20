import { FC } from "react";
import Image from "next/image";

interface ArtistCircleProps {
  avatar: {
    avatarUrl?: string | null;
    seed?: string;
  };
  size: number;
  className?: string;
}

const ArtistCircle: FC<ArtistCircleProps> = ({ avatar, size, className }) => {
  const avatarSrc = avatar.avatarUrl
    ? avatar.avatarUrl
    : `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatar.seed || "default"}`;

  return (
    <div
      className={`${className || ""} box-shadow flex items-center justify-center overflow-hidden rounded-full bg-white`}
      style={{
        width: `${size}rem`,
        height: `${size}rem`,
      }}
    >
      <Image
        src={avatarSrc}
        alt="Artist avatar"
        width={size * 10 * 0.9}
        height={size * 10 * 0.9}
        unoptimized
        style={{
          width: `${size * 0.9}rem`,
          height: `${size * 0.9}rem`,
        }}
      />
    </div>
  );
};

export default ArtistCircle;
