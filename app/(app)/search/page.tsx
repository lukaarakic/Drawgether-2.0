import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import BoxButton from "@/app/components/ui/BoxButton";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import BoxLabel from "@/app/components/ui/BoxLabel";
import SearchIcon from "@/app/assets/misc/searchIcon.svg";

export const metadata: Metadata = {
  title: "Find Artist",
  description: "Find Artist",
};

function generateRandomRotation(seed: number): number {
  return ((seed * 7) % 5) - 2.5;
}

// Dummy artists data
const dummyArtists = [
  { id: "a1", username: "cosmicArtist", avatar: null },
  { id: "a2", username: "starPainter", avatar: null },
  { id: "a3", username: "waveCreator", avatar: null },
  { id: "a4", username: "peakDrawer", avatar: null },
  { id: "a5", username: "urbanSketch", avatar: null },
];

type SearchPageProps = {
  searchParams: Promise<{ search?: string }>;
};

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const { search: searchTerm } = await searchParams;

  // Filter dummy artists based on search term
  const artists = searchTerm
    ? dummyArtists.filter((artist) =>
        artist.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  return (
    <main className="">
      <form method="GET" className="flex items-center justify-center gap-12">
        <input
          type="text"
          name="search"
          id="search"
          defaultValue={searchTerm || ""}
          className="input w-[70%] md:w-220"
          placeholder="Search..."
          style={{
            rotate: `${-1.87}deg`,
          }}
        />
        <BoxButton type="submit" className="p-4" degree={6.32}>
          <Image src={SearchIcon} alt="Search" className="h-22 w-22" />
        </BoxButton>
      </form>

      <div className="mt-16 flex flex-col items-center">
        {artists.length ? (
          <p
            className="text-border mb-12 text-center text-32 tracking-[.5rem] text-blue"
            data-text="Search results:"
          >
            Search results:
          </p>
        ) : null}

        {artists.length > 0 ? (
          artists.map((artist, index) => (
            <Link
              href={`/artist/${artist.username}`}
              key={artist.id}
              className="mb-8 flex items-center gap-8"
            >
              <ArtistCircle
                size={11.8}
                avatar={{
                  avatarUrl: artist.avatar,
                  seed: artist.username,
                }}
              />

              <BoxLabel degree={generateRandomRotation(index % 4)}>
                <div className="flex h-28 w-116 items-center justify-between gap-20 px-4">
                  <p
                    className="text-border text-border-lg text-32"
                    data-text={artist.username}
                  >
                    {artist.username}
                  </p>
                </div>
              </BoxLabel>
            </Link>
          ))
        ) : searchTerm?.length ? (
          <p
            className="text-border mb-12 text-center text-32 tracking-[.5rem] text-white"
            data-text="No artists found"
          >
            No artists found
          </p>
        ) : null}
      </div>
    </main>
  );
};

export default SearchPage;
