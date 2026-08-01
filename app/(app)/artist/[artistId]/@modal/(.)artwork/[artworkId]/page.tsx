import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import { getArtist } from "@/app/lib/auth-utils";
import { getArtworkWithArtistsAndComments } from "@/app/lib/data/artworks";
import { isArtworkLikedByArtist } from "@/app/lib/data/interactions";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { logoutAction } from "@/app/lib/actions/logout";

export const metadata: Metadata = {
  title: "Artwork",
  description: "Preview artwork and comments.",
};

const ShowArtwork = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;
  const loggedInArtistId = await getArtist();

  if (!loggedInArtistId) {
    await logoutAction();
    redirect("/login");
  }

  const artwork = await getArtworkWithArtistsAndComments(artworkId);

  if (!artwork) {
    return (
      <Modal>
        <div>Artwork not found</div>
      </Modal>
    );
  }

  const isLiked = await isArtworkLikedByArtist(
    loggedInArtistId.id,
    artworkId,
  );

  return (
    <Modal
      boxClassName="w-max h-min top-[52.5%]"
      className="grid w-max grid-cols-2 items-start justify-items-center gap-20"
    >
      <ArtworkPost
        artwork={artwork}
        index={1}
        className="w-full"
        showComments={false}
        isLiked={isLiked}
      />

      <CommentContainer artwork={artwork} />
    </Modal>
  );
};

export default ShowArtwork;
