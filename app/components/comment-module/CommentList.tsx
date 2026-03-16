import Comment from "./Comment";

const CommentList = ({
  comments,
  artworkId,
}: {
  comments: {
    id: string;
    content: string;
    artist: {
      id: string;
      username: string;
      avatar: string | null;
    };
  }[];
  artworkId: string;
}) => {
  return (
    <div
      className="mx-auto w-full overflow-y-auto max-h-230"
      data-lenis-prevent
    >
      {comments.length > 0 ? (
        comments.map((comment) => (
          <Comment
            comment={comment}
            key={`${comment.id}${comment.artist.id}`}
            artworkId={artworkId}
          />
        ))
      ) : (
        <p
          className="text-border text-border-sm mb-24 p-8 text-25 text-white"
          data-text="There are no comments on this artwork"
        >
          There are no comments on this artwork
        </p>
      )}
    </div>
  );
};

export default CommentList;
