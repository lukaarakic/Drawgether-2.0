import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import BoxLabel from "@/app/components/ui/BoxLabel";
import SmallArtworkContainer from "@/app/components/artwork-module/profile-artworks/SmallArtworkContainer";
import ArtworksContainer from "@/app/components/artwork-module/profile-artworks/ArtworksContainer";
import SettingsIcon from "@/app/assets/misc/settings.svg";
import { notFound } from "next/navigation";

// Dummy artist data
const dummyArtists = [
  {
    id: "a1",
    username: "cosmicArtist",
    avatar: null,
    artworks: [
      {
        id: "art1",
        theme: "Space Adventure",
        image: "https://picsum.photos/seed/space/572/572",
        likesCount: 42,
      },
      {
        id: "art2",
        theme: "Galaxy Dreams",
        image: "https://picsum.photos/seed/galaxy/572/572",
        likesCount: 23,
      },
    ],
  },
  {
    id: "a2",
    username: "starPainter",
    avatar: null,
    artworks: [
      {
        id: "art3",
        theme: "Nebula Colors",
        image: "https://picsum.photos/seed/nebula/572/572",
        likesCount: 67,
      },
    ],
  },
  {
    id: "a3",
    username: "waveCreator",
    avatar: null,
    artworks: [],
  },
  {
    id: "a4",
    username: "peakDrawer",
    avatar: null,
    artworks: [
      {
        id: "art4",
        theme: "Mountain Peak",
        image: "https://picsum.photos/seed/peak/572/572",
        likesCount: 89,
      },
      {
        id: "art5",
        theme: "Valley View",
        image: "https://picsum.photos/seed/valley/572/572",
        likesCount: 34,
      },
      {
        id: "art6",
        theme: "Forest Trail",
        image: "https://picsum.photos/seed/forest/572/572",
        likesCount: 56,
      },
    ],
  },
  {
    id: "a5",
    username: "urbanSketch",
    avatar: null,
    artworks: [
      {
        id: "art7",
        theme: "City Lights",
        image: "https://picsum.photos/seed/city/572/572",
        likesCount: 15,
      },
    ],
  },
];

// Simulated logged-in user (for demo)
const loggedInUserId = "a1";

type ProfilePageProps = {
  params: Promise<{ artistId: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { artistId } = await params;
  const artist = dummyArtists.find((a) => a.username === artistId);

  return {
    title: artist ? `${artist.username} | Profile` : "Artist Not Found",
    description: "Where AI and creativity connect",
  };
}

const Profile = async ({ params }: ProfilePageProps) => {
  const { artistId } = await params;
  const artist = dummyArtists.find((a) => a.username === artistId);

  if (!artist) {
    notFound();
  }

  const isLoggedInArtist = artist.id === loggedInUserId;
  const hasArtworks = artist.artworks.length > 0;

  return (
    <div className="mx-auto w-[90%] xs:w-7xl">
      <div className="mb-32 flex flex-col items-center justify-center gap-16 md:flex-row">
        <ArtistCircle
          size={16.9}
          avatar={{
            avatarUrl: artist.avatar,
            seed: artist.username,
          }}
        />
        <BoxLabel degree={-2}>
          <div className="flex h-40 w-[41.3rem] items-center justify-between gap-20 px-4">
            <p
              className="text-border text-border-lg text-32"
              data-text={`@${artist.username}`}
            >
              @{artist.username}
            </p>

            {isLoggedInArtist && (
              <Link href={`/artist/${artist.username}/settings`}>
                <Image
                  src={SettingsIcon}
                  alt="Settings"
                  className="pointer-events-none w-20"
                />
              </Link>
            )}
          </div>
        </BoxLabel>
      </div>

      {hasArtworks ? (
        <>
          {/* Desktop view */}
          <div className="hidden md:block">
            <SmallArtworkContainer artist={artist} />
          </div>
          {/* Mobile view */}
          <div className="md:hidden">
            <ArtworksContainer
              artworks={artist.artworks}
              profileRoute={artist.username}
            />
          </div>
        </>
      ) : (
        <BoxLabel>
          <p
            className="text-border text-border-sm w-full text-center text-32 text-white"
            data-text="No artworks available"
          >
            No artworks available
          </p>
        </BoxLabel>
      )}
    </div>
  );
};

export default Profile;
