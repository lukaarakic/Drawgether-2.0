"use client";

import Image from "next/image";
import TrashSVG from "@/app/assets/misc/trash.svg";
import { useState, useTransition } from "react";
import { deleteCommentAction } from "@/app/lib/actions/comment";
import { usePathname, useRouter } from "next/navigation";

const DeleteCommentButton = ({
  commentId,
  artworkId,
}: {
  commentId: string;
  artworkId: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const path = usePathname();
  const router = useRouter();

  const handleDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteCommentAction(commentId, artworkId, path);

      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="relative ml-auto">
      <button
        className="cursor-pointer disabled:opacity-70"
        aria-label="Delete comment"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Image src={TrashSVG} alt="Delete comment" className="h-24 w-24" />
      </button>

      {errorMessage && (
        <p className="absolute right-0 top-full w-max whitespace-nowrap text-14 text-pink">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default DeleteCommentButton;
