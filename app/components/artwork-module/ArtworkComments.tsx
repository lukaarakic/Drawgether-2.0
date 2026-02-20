import Link from "next/link";

type Comment = {
  id: string;
  content: string;
  artist: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

type ArtworkCommentsProps = {
  comments: Comment[];
  artworkId: string;
};

function generateRandomRotation(seed: number): number {
  return ((seed * 7) % 5) - 2.5;
}

const ArtworkComments = ({ comments, artworkId }: ArtworkCommentsProps) => {
  const hasComments = comments.length > 0;

  return (
    <div
      className="box-shadow bg-blue px-6 py-6 text-20 text-white"
      style={{
        rotate: `${generateRandomRotation((new Date().getHours() % 10) + 2)}deg`,
      }}
    >
      {hasComments
        ? comments.slice(0, 2).map((comment) => {
            const isCommentLong = comment.content.length > 25;
            const content = isCommentLong
              ? `${comment.content.slice(0, 25)}...`
              : comment.content;

            return (
              <div key={comment.id}>
                <Link
                  href={`/artist/${comment.artist.username}`}
                  className="text-border text-border-sm text-pink"
                  data-text={`@${comment.artist.username}:`}
                >
                  @{comment.artist.username}:
                </Link>
                <p
                  className="text-border text-border-sm ml-2"
                  data-text={content}
                >
                  {content}
                </p>
              </div>
            );
          })
        : null}

      <Link
        href={`/artwork/${artworkId}/comments`}
        scroll={false}
        data-text={
          hasComments
            ? "View more..."
            : "Be the first to comment on this artwork"
        }
        className={`text-border text-border-sm ${hasComments ? "mt-5" : ""}`}
      >
        {hasComments
          ? "View more..."
          : "Be the first to comment on this artwork"}
      </Link>
    </div>
  );
};

export default ArtworkComments;
