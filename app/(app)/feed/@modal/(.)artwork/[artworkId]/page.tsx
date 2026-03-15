import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import { db } from "@/app/lib/db";

const ShowComments = async ({
  params,
}: {
  params: Promise<{ artworkId: string }>;
}) => {
  const { artworkId } = await params;

  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    columns: {
      id: true,
    },
    with: {
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

  return (
    <Modal boxClassName="w-max h-min top-[45%]" className="w-max">
      <CommentContainer
        artwork={artwork ? artwork : { id: artworkId, comments: [] }}
      />
    </Modal>
  );
};

export default ShowComments;
