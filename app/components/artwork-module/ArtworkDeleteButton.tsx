"use client";

import Image from "next/image";
import TrashIcon from "@/app/assets/misc/trash.svg";
import { usePathname } from "next/navigation";
import { deleteArtworkAction } from "@/app/lib/actions/delete-artwork";

const ArtworkDeleteButton = ({ artworkId }: { artworkId: string }) => {
  const path = usePathname();

  return (
    <button
      onClick={() => deleteArtworkAction(artworkId, path)}
      className="cursor-pointer"
    >
      <Image
        src={TrashIcon}
        alt=""
        width={60}
        height={60}
        className="h-24 w-24"
      />
    </button>
  );
};
export default ArtworkDeleteButton;
