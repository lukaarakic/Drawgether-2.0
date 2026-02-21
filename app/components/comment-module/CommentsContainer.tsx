import CommentList from "./CommentList";

const CommentContainer = ({
  artwork,
}: {
  artwork: {
    comments: {
      id: string;
      content: string;
      artist: {
        id: string;
        username: string;
      };
    }[];
  };
}) => {
  return (
    <>
      <div className="flex h-full flex-col items-center w-full">
        <p
          className="text-border mb-12 -rotate-2 text-center text-32 text-blue"
          data-text="Comments"
        >
          Comments
        </p>

        <CommentList
          comments={artwork.comments.map((comment) => ({
            ...comment,
          }))}
        />

        <form className="mt-auto">
          <div className="flex items-center justify-center gap-8">
            <input
              type="text"
              name="content"
              className="input h-20 max-w-2xl px-8 py-10 text-20"
              placeholder="Your comment..."
            />

            <button
              type="submit"
              className="box-shadow flex h-28 w-28 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90"
            >
              <div className={`text-16 text-white`}>Post</div>
            </button>
          </div>
          {false && (
            <div className="flex items-center justify-center">
              <p className="text-red-500 text-sm mt-2">Error</p>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default CommentContainer;
