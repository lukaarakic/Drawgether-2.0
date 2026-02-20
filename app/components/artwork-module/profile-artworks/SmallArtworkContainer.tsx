import Link from "next/link";
import SmallArtwork from "./SmallArtwork";

type Artwork = {
  id: string;
  image: string;
  theme: string;
  likesCount: number;
};

type Artist = {
  username: string;
  artworks: Artwork[];
};

const SmallArtworkContainer = ({ artist }: { artist: Artist }) => {
  return (
    <div className="grid grid-cols-3 items-center justify-items-center gap-x-4 gap-y-8">
      {artist.artworks.map((artwork, index) => (
        <Link
          key={artwork.id}
          href={`/artist/${artist.username}/artwork/${artwork.id}`}
        >
          <SmallArtwork art={artwork.image} index={index} />
        </Link>
      ))}
    </div>
  );
};

export default SmallArtworkContainer;
