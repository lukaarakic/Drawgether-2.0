import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import { getArtistId } from "@/app/lib/auth-utils";
import { getArtworkWithArtistsAndComments } from "@/app/lib/data/artworks";
import { isArtworkLikedByArtist } from "@/app/lib/data/interactions";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artwork",
  description: "View artwork details and comments.",
};

const ArtworkPage = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;

  const artwork = await getArtworkWithArtistsAndComments(artworkId);

  if (!artwork) {
    notFound();
  }

  const { artistId } = await getArtistId();

  const isLiked = await isArtworkLikedByArtist(artistId, artworkId);

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
