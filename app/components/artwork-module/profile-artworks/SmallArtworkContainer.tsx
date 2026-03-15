import Link from "next/link";
import SmallArtwork from "./SmallArtwork";

const SmallArtworkContainer = ({
  artist,
}: {
  artist: {
    artworks: { id: string; artworkImage: string }[];
    username: string;
  };
}) => {
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
