import CommentForm from "./CommentForm";
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
        avatar: string | null;
      };
    }[];
    id: string;
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
          artworkId={artwork.id}
        />

        <CommentForm artworkId={artwork.id} />
      </div>
    </>
  );
};

export default CommentContainer;
