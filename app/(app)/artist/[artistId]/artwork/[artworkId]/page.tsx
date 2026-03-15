import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import { getArtistId } from "@/app/lib/auth-utils";
import { db } from "@/app/lib/db";
import { notFound } from "next/navigation";

const ArtworkPage = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;

  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    with: {
      artists: {
        with: {
          artist: {
            columns: {
              id: true,
              username: true,
            },
          },
        },
      },
      comments: {
        columns: {
          id: true,
          content: true,
        },
        with: {
          artist: {
            columns: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });

  if (!artwork) {
    notFound();
  }

  const { artistId } = await getArtistId();

  const existingLike = await db.query.likes.findFirst({
    where: (like, { eq }) =>
      eq(like.artistId, artistId) && eq(like.artworkId, artworkId),
  });

  const isLiked = !!existingLike;

  const formattedArtwork = {
    ...artwork,
    artists: artwork.artists.map((joinRow) => joinRow.artist),
  };

  return (
    <div className="grid grid-cols-2 p-8 gap-20 mt-[10vh]">
      <ArtworkPost
        artwork={formattedArtwork}
        index={1}
        className="w-full"
        showComments={false}
        isLiked={isLiked}
      />
      <CommentContainer artwork={artwork} />
    </div>
  );
};

export default ArtworkPage;
