import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import { getArtistId } from "@/app/lib/auth-utils";
import { getArtworkWithArtistsCommentsAndLikes } from "@/app/lib/data/artworks";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artwork",
  description: "View artwork details, likes, and comments.",
};

const ArtworkPage = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;
  const { artistId } = await getArtistId();

  const artwork = await getArtworkWithArtistsCommentsAndLikes(artworkId);

  if (!artwork) {
    notFound();
  }

  const isLiked = artwork.likes.some((like) => like.artistId === artistId);

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 p-8 gap-10 md:gap-20 mt-[10vh] h-fit pb-80">
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
