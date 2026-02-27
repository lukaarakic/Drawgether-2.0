import ArtistCircle from "@/app/components/ui/ArtistCircle";
import BoxLabel from "@/app/components/ui/BoxLabel";
import SmallArtworkContainer from "@/app/components/artwork-module/profile-artworks/SmallArtworkContainer";
import ArtworksContainer from "@/app/components/artwork-module/profile-artworks/ArtworksContainer";
import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { getArtist, logout } from "@/app/lib/auth-utils";
import Link from "next/link";
import Image from "next/image";
import SettingsIcon from "@/app/assets/misc/settings.svg";

const Profile = async ({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) => {
  const { artistId } = await params;

  const artist = await prisma.artist.findUnique({
    where: { username: artistId },
    select: {
      id: true,
      username: true,
      artworks: {
        select: {
          id: true,
          theme: true,
          artworkImage: true,
          likesCount: true,
          createdAt: true,
          updatedAt: true,
          roomId: true,
          commentsCount: true,
          artists: {
            select: { id: true, username: true },
          },
          comments: {
            select: {
              id: true,
              content: true,
              artist: { select: { id: true, username: true } },
            },
          },
        },
      },
    },
  });

  if (!artist) {
    notFound();
  }

  const loggedInArtistId = await getArtist();

  if (!loggedInArtistId) {
    return logout();
  }

  const isLoggedInArtist = loggedInArtistId.id === artist.id;
  const hasArtworks = artist.artworks.length > 0;

  return (
    <>
      <div className="mx-auto w-[90%] xs:w-7xl">
        <div className="mb-32 flex flex-col items-center justify-center gap-16 md:flex-row">
          <ArtistCircle username={artist.username} size="large" />
          <BoxLabel degree={-2}>
            <div className="flex h-40 items-center justify-between gap-20 px-4">
              <p
                className="text-border text-border-lg text-32"
                data-text={`@${artist.username}`}
              >
                @{artist.username}
              </p>

              {isLoggedInArtist ? (
                <Link href={`/artist/${artist.username}/settings`}>
                  <Image
                    src={SettingsIcon}
                    alt=""
                    className="pointer-events-none w-20"
                  />
                </Link>
              ) : null}
            </div>
          </BoxLabel>
        </div>

        {hasArtworks ? (
          <>
            <div className="hidden md:block">
              <SmallArtworkContainer artist={artist} />
            </div>
            <div className="md:hidden">
              <ArtworksContainer artworks={artist.artworks} />
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
    </>
  );
};

export default Profile;
