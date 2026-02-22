import Link from "next/link";
import SmallArtwork from "./SmallArtwork";
import { Prisma } from "@/app/generated/prisma/client";

type ArtistWithArtworks = Prisma.ArtistGetPayload<{
  select: {
    id: true;
    username: true;
    artworks: { select: { id: true; artworkImage: true } };
  };
}>;

const SmallArtworkContainer = ({ artist }: { artist: ArtistWithArtworks }) => {
  return (
    <div className="grid grid-cols-3 items-center justify-items-center gap-x-4 gap-y-8">
      {artist.artworks.map((artwork, index) => (
        <Link
          key={artwork.id}
          href={`/artist/${artist.username}/artwork/${artwork.id}`}
        >
          <SmallArtwork art={artwork.artworkImage} index={index} />
        </Link>
      ))}
    </div>
  );
};

export default SmallArtworkContainer;
