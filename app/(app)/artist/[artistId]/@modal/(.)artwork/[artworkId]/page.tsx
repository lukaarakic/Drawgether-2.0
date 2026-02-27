import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import { getArtist, logout } from "@/app/lib/auth-utils";
import prisma from "@/app/lib/db";

const ShowArtwork = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;
  const loggedInArtistId = await getArtist();

  if (!loggedInArtistId) return logout();

  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    include: {
      comments: {
        include: {
          artist: {
            select: { id: true, username: true },
          },
        },
      },
      artists: {
        select: { id: true, username: true },
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

  const existingLike = await prisma.like.findUnique({
    where: {
      artistId_artworkId: {
        artistId: loggedInArtistId.id,
        artworkId: artworkId,
      },
    },
  });

  isLiked = !!existingLike;

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
