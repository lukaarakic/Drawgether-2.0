import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import { db } from "@/app/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artwork Comments",
  description: "Read and join artwork discussions.",
};

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
              avatar: true,
            },
          },
        },
      },
    },
  });

  return (
    <Modal boxClassName="w-max h-min top-[45%]" className="w-fit">
      <CommentContainer
        artwork={artwork ? artwork : { id: artworkId, comments: [] }}
      />
    </Modal>
  );
};

export default ShowComments;
