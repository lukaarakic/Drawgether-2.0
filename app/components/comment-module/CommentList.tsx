import Comment from "./Comment";

const CommentList = ({
  comments,
}: {
  comments: {
    id: string;
    content: string;
    artist: {
      id: string;
      username: string;
    };
  }[];
}) => {
  return (
    <div className="mx-auto w-full overflow-y-auto" data-lenis-prevent>
      {comments.length > 0 ? (
        comments.map((comment) => (
          <Comment
            comment={comment}
            key={`${comment.id}${comment.artist.id}`}
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
