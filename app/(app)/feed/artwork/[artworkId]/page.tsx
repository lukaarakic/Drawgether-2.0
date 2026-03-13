import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import { getArtistId } from "@/app/lib/auth-utils";
import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";

const ArtworkPage = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;
  const { artistId } = await getArtistId();

  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    include: {
      artists: {
        select: { id: true, username: true },
      },
      comments: {
        select: {
          id: true,
          content: true,
          artist: { select: { id: true, username: true } },
        },
      },
      likes: {
        select: {
          artistId: true,
        },
      },
    },
  });

  if (!artwork) {
    notFound();
  }

  const isLiked = artwork.likes.some((like) => like.artistId === artistId);

  return (
    <div className="grid grid-cols-2 p-8 gap-20 mt-[10vh]">
      <ArtworkPost
        isLiked={isLiked}
        artwork={artwork}
        index={1}
        className="w-full"
        showComments={false}
      />
      <CommentContainer artwork={artwork} />
    </div>
  );
};

export default ArtworkPage;
