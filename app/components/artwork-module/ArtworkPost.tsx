import BoxLabel from "@/app/components/ui/BoxLabel";
import ArtworkLikeButton from "./ArtworkLikeButton";
import ArtistCircle from "../ui/ArtistCircle";
import ArtworkComments from "./ArtworkComments";
import ArtworkDeleteButton from "./ArtworkDeleteButton";
import Image from "next/image";
import Link from "next/link";
import CommentIcon from "@/app/assets/misc/comment.svg";

type Artist = {
  id: string;
  username: string;
  avatar?: string;
};

type Comment = {
  id: string;
  content: string;
  artist: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

type ArtworkPostProps = {
  id: string;
  theme: string;
  index: number;
  artworkImage: string;
  likesCount: number;
  isLiked?: boolean;
  artists: Artist[];
  comments?: Comment[];
  showComments?: boolean;
  showDeleteButton?: boolean;
  className?: string;
};

function generateRandomRotation(seed: number): number {
  return ((seed * 7) % 5) - 2.5;
}

const ArtworkPost = ({
  id,
  theme,
  index,
  artworkImage,
  likesCount,
  isLiked = false,
  artists,
  comments = [],
  showComments = false,
  showDeleteButton = false,
  className,
}: ArtworkPostProps) => {
  return (
    <article className={className}>
      <BoxLabel degree={generateRandomRotation((index % 12) + 1)}>
        <h2
          data-text={theme}
          className="text-border text-border-lg whitespace-break-spaces p-2 text-25 md:text-32"
        >
          {theme}
        </h2>
      </BoxLabel>

      <div
        className="relative mb-24"
        style={{
          rotate: `${generateRandomRotation(index % 10) / 2}deg`,
        }}
      >
        <Image
          src={artworkImage}
          alt={theme}
          width={572}
          height={572}
          className="box-shadow mt-5 h-[57.2rem] w-[57.2rem] object-cover"
        />

        <div className="absolute -bottom-12 -left-5 flex">
          <ArtworkLikeButton likesCount={likesCount} isLiked={isLiked} />
          {showComments && (
            <Link href={`/artwork/${id}/comments`}>
              <Image src={CommentIcon} alt="Comments" className="h-24 w-24" />
            </Link>
          )}
          {showDeleteButton && <ArtworkDeleteButton artworkId={id} />}
        </div>

        <div className="absolute -bottom-16 -right-8 flex items-baseline">
          {artists.map((artist) => (
            <Link href={`/artist/${artist.username}`} key={artist.id}>
              <ArtistCircle
                size={6.8}
                avatar={{
                  avatarUrl: artist.avatar,
                  seed: artist.username,
                }}
                className="-mr-10"
              />
            </Link>
          ))}
        </div>
      </div>

      {showComments && comments.length > 0 && (
        <ArtworkComments comments={comments} artworkId={id} />
      )}
    </article>
  );
};

export default ArtworkPost;
