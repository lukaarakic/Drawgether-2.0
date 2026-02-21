import Link from "next/link";
import ArtistCircle from "../ui/ArtistCircle";
import BoxLabel from "../ui/BoxLabel";
import TrashSVG from "~/assets/misc/trash.svg";

export default function Comment({
  comment,
}: {
  comment: {
    id: string;
    content: string;
    artist: {
      id: string;
      username: string;
    };
  };
}) {
  return (
    <div className="mb-24 flex items-start gap-5">
      <Link href={`/artist/${comment.artist.username}`} className="shrink-0">
        <ArtistCircle size="small" username={comment.artist.username} />
      </Link>

      <div>
        <div className="flex items-center gap-8">
          <BoxLabel>
            <p
              className="text-border py-2 text-justify text-3xl"
              data-text={`@${comment.artist.username}`}
            >
              @{comment.artist.username}{" "}
            </p>
          </BoxLabel>
        </div>
        <p className="mt-4 wrap-break-word text-22 leading-none text-black">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
