import { getArtistId } from "@/app/lib/auth-utils";
import { Metadata } from "next";
import FeedInfiniteList from "@/app/(app)/feed/FeedInfiniteList";
import { getFeedChunk } from "@/app/lib/data/feed";

export const metadata: Metadata = {
  title: `Explore Artworks`,
  description: "Where AI and creativity connect",
};

const Home = async () => {
  const { artistId, role } = await getArtistId();
  const initialChunk = await getFeedChunk({
    artistId,
    cursor: null,
    limit: 6,
  });

  return (
    <div className="overflow-x-hidden">
      <FeedInfiniteList
        initialArtworks={initialChunk.artworks}
        initialLikedArtworkIds={initialChunk.likedArtworkIds}
        initialHasMore={initialChunk.hasMore}
        initialCursor={initialChunk.nextCursor}
        currentArtistId={artistId}
        currentArtistRole={role}
      />
    </div>
  );
};

export default Home;
