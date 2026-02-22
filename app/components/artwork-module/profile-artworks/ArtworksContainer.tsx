import { Prisma } from "@/app/generated/prisma/client";
import ArtworkPost from "../ArtworkPost";

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

const ArtworksContainer = ({ artworks }: ArtworksContainerProps) => {
  return (
    <div className="flex flex-col">
      {artworks.map((artwork, index) => (
        <ArtworkPost artwork={artwork} index={index} key={artwork.id} />
      ))}
    </div>
  );
};

export default ArtworksContainer;
