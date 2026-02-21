import Image from "next/image";
import TrashIcon from "@/app/assets/misc/trash.svg";

const ArtworkDeleteButton = ({ artworkId }: { artworkId: string }) => {
  return (
    <form
      method="POST"
      id={`delete-${artworkId}`}
      action={`/delete/${artworkId}`}
    >
      <input type="hidden" name="artworkId" value={artworkId} />
      <button type="submit" name="intent" value="delete">
        <Image
          src={TrashIcon}
          alt=""
          width={60}
          height={60}
          className="h-24 w-24"
        />
      </button>
    </form>
  );
};
export default ArtworkDeleteButton;
