import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import prisma from "@/app/lib/db";

const ShowArtwork = async ({
  params,
}: {
  params: Promise<{ artistId: string; artworkId: string }>;
}) => {
  const { artworkId } = await params;

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
      />

      <CommentContainer artwork={artwork} artworkId={artwork.id} />
    </Modal>
  );
};

export default ShowArtwork;
