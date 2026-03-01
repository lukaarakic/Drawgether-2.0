import { Prisma } from "@/app/generated/prisma/client";
import ArtworkPost from "../ArtworkPost";
import prisma from "@/app/lib/db";
import { getArtistId } from "@/app/lib/auth-utils";

type ArtworkWithArtists = Prisma.ArtworkGetPayload<{
  include: {
    artists: { select: { id: true; username: true } };
    comments: {
      select: {
        id: true;
        artist: { select: { id: true; username: true } };
        content: true;
      };
    };
  };
}>;

type ArtworksContainerProps = {
  artworks: ArtworkWithArtists[];
};

const ArtworksContainer = async ({ artworks }: ArtworksContainerProps) => {
  const { artistId } = await getArtistId();
  let likedArtworkIds = new Set<string>();

  const artistLikes = await prisma.like.findMany({
    where: {
      artistId,
      artworkId: { in: artworks.map((artwork) => artwork.id) },
    },
    select: {
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
