import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import { getArtistId } from "@/app/lib/auth-utils";
import prisma from "@/app/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: `Explore Artworks`,
  description: "Where AI and creativity connect",
};

const Home = async () => {
  const { artistId } = await getArtistId();

  const artworks = await prisma.artwork.findMany({
    select: {
      id: true,
      createdAt: true,
      theme: true,
      artworkImage: true,
      likesCount: true,
      commentsCount: true,
      roomId: true,
      updatedAt: true,
    },
    include: {
      artists: {
        select: {
          id: true,
          username: true,
        },
      },

      comments: {
        select: {
          id: true,
          content: true,
          artist: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

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
    <div>
      <div className="flex flex-col mt-20 md:mt-72">
        {artworks.map((artwork, index) => (
          <ArtworkPost
            key={artwork.id}
            index={index}
            // @ts-expect-error - TypeScript is having trouble inferring the type of artwork
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
