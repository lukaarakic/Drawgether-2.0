import { ArtworkWithArtists } from "@/drizzle/types";
import ArtworkPost from "../ArtworkPost";
import { getArtistId } from "@/app/lib/auth-utils";
import { db } from "@/app/lib/db";

type ArtworksContainerProps = {
  artworks: ArtworkWithArtists[];
};

const ArtworksContainer = async ({ artworks }: ArtworksContainerProps) => {
  const { artistId } = await getArtistId();
  let likedArtworkIds = new Set<string>();

  const artistLikes = await db.query.likes.findMany({
    where: (like, { eq, and, inArray }) =>
      and(
        eq(like.artistId, artistId),
        inArray(
          like.artworkId,
          artworks.map((artwork) => artwork.id),
        ),
      ),
    columns: {
      artworkId: true,
    },
  });

  likedArtworkIds = new Set(artistLikes.map((like) => like.artworkId));

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
