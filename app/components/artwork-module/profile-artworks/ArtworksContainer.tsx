import { ArtworkWithArtists } from "@/drizzle/types";
import ArtworkPost from "../ArtworkPost";
import { getArtistId } from "@/app/lib/auth-utils";
import { getLikedArtworkIds } from "@/app/lib/data/interactions";

type ArtworksContainerProps = {
  artworks: ArtworkWithArtists[];
};

const ArtworksContainer = async ({ artworks }: ArtworksContainerProps) => {
  const { artistId } = await getArtistId();

  const likedIds = await getLikedArtworkIds({
    artistId,
    artworkIds: artworks.map((artwork) => artwork.id),
  });
  const likedArtworkIds = new Set(likedIds);

  return (
    <div className="flex flex-col">
      {artworks.map((artwork, index) => (
        <ArtworkPost
          artwork={artwork}
          index={index}
          key={artwork.id}
          isLiked={likedArtworkIds.has(artwork.id)}
        />
      ))}
    </div>
  );
};

export default ArtworksContainer;
