import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import { getArtistId } from "@/app/lib/auth-utils";
import { db } from "@/app/lib/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Explore Artworks`,
  description: "Where AI and creativity connect",
};

const Home = async () => {
  const { artistId } = await getArtistId();

  const artworks = await db.query.artworks.findMany({
    with: {
      artists: {
        with: {
          artist: {
            columns: {
              id: true,
              username: true,
            },
          },
        },
      },
      comments: {
        with: {
          artist: {
            columns: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: (artwork, { desc }) => [desc(artwork.createdAt), desc(artwork.id)],
  });

  const formattedArtworks = artworks.map((artwork) => ({
    ...artwork,
    artists: artwork.artists.map((joinRow) => joinRow.artist),
  }));

  let likedArtworkIds = new Set<string>();

  const artistLikes = await db.query.likes.findMany({
    where: (likes, { and, eq, inArray }) =>
      and(
        eq(likes.artistId, artistId),
        inArray(
          likes.artworkId,
          artworks.map((a) => a.id),
        ),
      ),
    columns: {
      artworkId: true,
    },
  });

  likedArtworkIds = new Set(artistLikes.map((like) => like.artworkId));

  return (
    <div>
      <div className="flex flex-col mt-20 md:mt-72">
        {formattedArtworks.map((artwork, index) => (
          <ArtworkPost
            key={artwork.id}
            index={index}
            artwork={artwork}
            isLiked={likedArtworkIds.has(artwork.id)}
            className="mb-50"
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
