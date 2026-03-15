import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import { getArtist, logout } from "@/app/lib/auth-utils";
import { db } from "@/app/lib/db";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

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
    await logout();
    redirect("/login");
  }

  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    with: {
      comments: {
        with: {
          artist: {
            columns: { id: true, username: true },
          },
        },
      },
      artists: {
        with: {
          artist: {
            columns: { id: true, username: true },
          },
        },
      },
    },
  });

  if (!artwork) {
    return (
      <Modal>
        <div>Artwork not found</div>
      </Modal>
    );
  }

  let isLiked = false;

  const existingLike = await db.query.likes.findFirst({
    where: (like, { and, eq }) =>
      and(
        eq(like.artworkId, artworkId),
        eq(like.artistId, loggedInArtistId.id),
      ),
    columns: {
      artistId: true,
    },
  });

  isLiked = !!existingLike;

  const formattedArtwork = {
    ...artwork,
    artists: artwork.artists.map((joinRow) => joinRow.artist),
  };

  return (
    <Modal
      boxClassName="w-max h-min top-[52.5%]"
      className="grid w-max grid-cols-2 items-start justify-items-center gap-20"
    >
      <ArtworkPost
        artwork={formattedArtwork}
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
