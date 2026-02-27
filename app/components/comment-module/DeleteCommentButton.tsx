"use client";

import Image from "next/image";
import TrashSVG from "@/app/assets/misc/trash.svg";
import { useTransition } from "react";
import { deleteCommentAction } from "@/app/lib/actions/comment";
import { usePathname } from "next/navigation";

const DeleteCommentButton = ({
  commentId,
  artworkId,
}: {
  commentId: string;
  artworkId: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const path = usePathname();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCommentAction(commentId, artworkId, path);
    });
  };

  return (
    <button
      className="ml-auto cursor-pointer"
      aria-label="Delete comment"
      onClick={handleDelete}
    >
      <Image src={TrashSVG} alt="Delete comment" className="h-24 w-24" />
    </button>
  );
};

export default DeleteCommentButton;
