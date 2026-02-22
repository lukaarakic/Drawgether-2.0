import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import prisma from "@/app/lib/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Explore Artworks`,
  description: "Where AI and creativity connect",
};

const Home = async () => {
  const artworks = await prisma.artwork.findMany({
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
  });

  console.log(artworks);

  return (
    <div>
      <div className="flex flex-col">
        {artworks.map((artwork, index) => (
          <ArtworkPost
            key={artwork.id}
            index={index}
            artwork={artwork}
            className="mb-50"
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
