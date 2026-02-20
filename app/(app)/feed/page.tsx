import ArtworkPost from "@/app/components/artwork-module/ArtworkPost";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Explore Artworks`,
  description: "Where AI and creativity connect",
};

const dummyArtworks = [
  {
    id: "1",
    theme: "Space Adventure",
    artworkImage: "https://picsum.photos/seed/space/572/572",
    likesCount: 42,
    isLiked: true,
    artists: [
      { id: "a1", username: "cosmicArtist" },
      { id: "a2", username: "starPainter" },
    ],
    comments: [
      {
        id: "c1",
        content: "This is absolutely stunning! Love the colors",
        artist: { id: "a3", username: "waveCreator", avatar: null },
      },
      {
        id: "c2",
        content: "Amazing work!",
        artist: { id: "a4", username: "peakDrawer", avatar: null },
      },
    ],
  },
  {
    id: "2",
    theme: "Ocean Dreams",
    artworkImage: "https://picsum.photos/seed/ocean/572/572",
    likesCount: 28,
    isLiked: false,
    artists: [{ id: "a3", username: "waveCreator" }],
    comments: [
      {
        id: "c3",
        content: "The waves look so real!",
        artist: { id: "a1", username: "cosmicArtist", avatar: null },
      },
    ],
  },
  {
    id: "3",
    theme: "Mountain Sunrise",
    artworkImage: "https://picsum.photos/seed/mountain/572/572",
    likesCount: 67,
    isLiked: true,
    artists: [
      { id: "a4", username: "peakDrawer" },
      { id: "a5", username: "sunriseArt" },
      { id: "a6", username: "natureLover" },
    ],
    comments: [],
  },
  {
    id: "4",
    theme: "City Lights",
    artworkImage: "https://picsum.photos/seed/city/572/572",
    likesCount: 15,
    isLiked: false,
    artists: [{ id: "a7", username: "urbanSketch" }],
    comments: [
      {
        id: "c4",
        content: "Love the neon vibes",
        artist: { id: "a2", username: "starPainter", avatar: null },
      },
      {
        id: "c5",
        content: "Great perspective!",
        artist: { id: "a5", username: "sunriseArt", avatar: null },
      },
      {
        id: "c6",
        content: "This captures the city perfectly",
        artist: { id: "a6", username: "natureLover", avatar: null },
      },
    ],
  },
];

const Home = () => {
  return (
    <div>
      <div className="flex flex-col">
        {dummyArtworks.map((artwork, index) => (
          <ArtworkPost
            key={artwork.id}
            id={artwork.id}
            index={index}
            theme={artwork.theme}
            artworkImage={artwork.artworkImage}
            likesCount={artwork.likesCount}
            isLiked={artwork.isLiked}
            artists={artwork.artists}
            comments={artwork.comments}
            showComments={true}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
