import ArtworkPost from "../ArtworkPost";

type Artwork = {
  id: string;
  image: string;
  theme: string;
  likesCount: number;
};

type ArtworksContainerProps = {
  artworks: Artwork[];
  profileRoute?: string | null;
};

const ArtworksContainer = ({
  artworks,
  profileRoute,
}: ArtworksContainerProps) => {
  return (
    <div className="flex flex-col">
      {artworks.map((artwork, index) => (
        <ArtworkPost
          key={artwork.id}
          id={artwork.id}
          index={index}
          theme={artwork.theme}
          artworkImage={artwork.image}
          likesCount={artwork.likesCount}
          artists={[{ id: "owner", username: profileRoute || "unknown" }]}
        />
      ))}
    </div>
  );
};

export default ArtworksContainer;
