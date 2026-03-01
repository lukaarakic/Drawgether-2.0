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
    },
  });

  if (!artwork) {
    notFound();
  }

  const { artistId } = await getArtistId();

  const existingLike = await prisma.like.findUnique({
    where: { artistId_artworkId: { artistId, artworkId } },
  });

  const isLiked = !!existingLike;

  return (
    <div className="grid grid-cols-2 p-8 gap-20 mt-[10vh]">
      <ArtworkPost
        artwork={artwork}
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
