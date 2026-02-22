import CommentContainer from "@/app/components/comment-module/CommentsContainer";
import Modal from "@/app/components/ui/Modal";
import prisma from "@/app/lib/db";

const ShowComments = async ({
  params,
}: {
  params: Promise<{ artworkId: string }>;
}) => {
  const { artworkId } = await params;

  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    select: {
      id: true,
      comments: {
        select: {
          id: true,
          content: true,
          artist: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });

  console.log(artwork);

  return (
    <Modal boxClassName="w-max h-min top-[45%]" className="w-max">
      <CommentContainer artwork={artwork ? artwork : { comments: [] }} />
    </Modal>
  );
};

export default ShowComments;
