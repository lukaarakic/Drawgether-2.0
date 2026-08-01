import ArtistCircle from "@/app/components/ui/ArtistCircle";
import BoxLabel from "@/app/components/ui/BoxLabel";
import SmallArtworkContainer from "@/app/components/artwork-module/profile-artworks/SmallArtworkContainer";
import ArtworksContainer from "@/app/components/artwork-module/profile-artworks/ArtworksContainer";
import { notFound, redirect } from "next/navigation";
import { getArtistProfileByUsername } from "@/app/lib/data/artists";
import { getArtist } from "@/app/lib/auth-utils";
import Link from "next/link";
import Image from "next/image";
import SettingsIcon from "@/app/assets/misc/settings.svg";
import Follow from "./Follow";
import type { Metadata } from "next";
import { logoutAction } from "@/app/lib/actions/logout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistId: string }>;
}): Promise<Metadata> {
  const { artistId } = await params;
  const displayArtistId = artistId
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
  const title = `${displayArtistId} Profile`;
  const description = `View ${displayArtistId}'s profile, followers, and artworks.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

const Profile = async ({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) => {
  const { artistId } = await params;

  const artist = await getArtistProfileByUsername(artistId);

  if (!artist) {
    notFound();
  }

  const loggedInArtistId = await getArtist();

  if (!loggedInArtistId) {
    await logoutAction();
    redirect("/login");
  }

  const isOwner = loggedInArtistId.id === artist.id;
  const isLoggedInArtist = loggedInArtistId.id === artist.id;
  const hasArtworks = artist.artworks.length > 0;

  const isFollowing = artist.followers.some(
    (follower) => follower.followerId === loggedInArtistId.id,
  );

  return (
    <>
      <div className="mx-auto w-[90%] xs:w-7xl mt-20 md:mt-72 pb-60">
        <div className="flex flex-col items-center justify-center gap-16 mb-32">
          <div className="flex flex-col items-center justify-center gap-16 md:flex-row">
            <ArtistCircle
              avatarUrl={artist.avatar}
              username={artist.username}
              size="large"
            />
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

          <div className="flex items-center justify-between gap-8 md:gap-16">
            <Follow
              isOwner={isOwner}
              isFollowing={isFollowing}
              artistId={artist.id}
              followerCount={artist.followerCount}
              followingCount={artist.followingCount}
            />
          </div>
        </div>

        {hasArtworks ? (
          <>
            <div className="hidden md:block">
              <SmallArtworkContainer
                artist={{
                  username: artist.username,
                  artworks: artist.artworks.map(({ id, artworkImage }) => ({
                    id,
                    artworkImage,
                  })),
                }}
              />
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
