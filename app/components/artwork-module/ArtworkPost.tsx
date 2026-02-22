import BoxLabel from "@/app/components/ui/BoxLabel";
import ArtworkLikeButton from "./ArtworkLikeButton";
import ArtistCircle from "../ui/ArtistCircle";
import ArtworkComments from "./ArtworkComments";
import ArtworkDeleteButton from "./ArtworkDeleteButton";
import Image from "next/image";
import Link from "next/link";
import CommentIcon from "@/app/assets/misc/comment.svg";
import { Prisma } from "@/app/generated/prisma/client";

type ArtworkWithArtists = Prisma.ArtworkGetPayload<{
  include: {
    artists: { select: { id: true; username: true } };
    comments: {
      select: {
        id: true;
        content: true;
        artist: { select: { id: true; username: true } };
      };
    };
  };
}>;

function generateRandomRotation(seed: number): number {
  return ((seed * 7) % 5) - 2.5;
}

const ArtworkPost = ({
  artwork,
  index,
  className,
  showComments = true,
}: {
  artwork: ArtworkWithArtists;
  index: number;
  className?: string;
  showComments?: boolean;
}) => {
  return (
    <article className={`${className}`}>
      <BoxLabel degree={generateRandomRotation((index % 12) + 1)}>
        <h2
          data-text={artwork.theme}
          className="text-border text-border-lg whitespace-break-spaces p-2 text-25 md:text-32"
        >
          {artwork.theme}
        </h2>
      </BoxLabel>

      <div
        className="relative mb-24"
        style={{
          rotate: `${generateRandomRotation((index % 12) + 1)}deg`,
        }}
      >
        <Image
          src={artwork.artworkImage}
          alt={artwork.theme}
          width={572}
          height={572}
          className="box-shadow mt-5 h-[57.2rem] w-[57.2rem] object-cover"
        />

        <div className="absolute -bottom-12 -left-5 flex">
          <ArtworkLikeButton likesCount={artwork.likesCount} isLiked={false} />
          {showComments && (
            <Link
              href={`/artwork/${artwork.id}/comments`}
              className="flex items-end"
            >
              <Image src={CommentIcon} alt="Comments" className="h-24 w-24" />
            </Link>
          )}

          <ArtworkDeleteButton artworkId={artwork.id} />
        </div>

        <div className="absolute -bottom-10 -right-8 flex items-baseline">
          {artwork.artists.map((artist) => (
            <Link
              href={`/artist/${artist.username}`}
              key={artist.username}
              className="-mr-10 last-of-type:mr-0"
            >
              <ArtistCircle
                username={artist.username || "default"}
                className=""
              />
            </Link>
          ))}
        </div>
      </div>
      {showComments && (
        <ArtworkComments comments={artwork.comments} artworkId={artwork.id} />
      )}
    </article>
  );
};

export default ArtworkPost;
