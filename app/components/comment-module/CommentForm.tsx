"use client";

import { addCommentAction } from "@/app/lib/actions/comment";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CommentForm = ({ artworkId }: { artworkId: string }) => {
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const path = usePathname();
  const router = useRouter();

  const isInvalid = content.trim() === "" || content.length > 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isInvalid) return {};

    setErrorMessage("");

    startTransition(async () => {
      const result = await addCommentAction(artworkId, content, path);

      if (result?.error) {
        setErrorMessage(result.error);
      } else {
        setContent("");
        // revalidatePath (called server-side by the action) doesn't
        // reliably invalidate this intercepted modal route — force a
        // client-triggered refetch of every active segment instead.
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-auto">
      <div className="flex items-center justify-center gap-8">
        <input
          type="text"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input h-20 max-w-2xl md:w-auto w-120 px-8 py-10 text-20"
          placeholder="Your comment..."
        />

        <button
          disabled={isPending}
          type="submit"
          className="box-shadow cursor-pointer flex h-28 w-28 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90"
        >
          <div className={`text-16 text-white`}>Post</div>
        </button>
      </div>
      {errorMessage && (
        <div className="flex items-center justify-center">
          <p className="text-red-500 text-3xl mt-2">{errorMessage}</p>
        </div>
      )}
    </form>
  );
};

export default CommentForm;
