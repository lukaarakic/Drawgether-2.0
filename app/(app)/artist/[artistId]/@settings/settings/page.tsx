import ArtistCircle from "@/app/components/ui/ArtistCircle";
import BoxButton from "@/app/components/ui/BoxButton";
import Modal from "@/app/components/ui/Modal";
import { logoutAction } from "@/app/lib/actions/logout";
import { verifyEmail } from "@/app/lib/actions/verify-email";
import { getArtistId } from "@/app/lib/auth-utils";
import { getArtistSettingsByUsername } from "@/app/lib/data/artists";
import { maskEmail } from "@/app/utils/misc";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account and email verification.",
};

const Settings = async ({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) => {
  const { artistId } = await params;

  const artist = await getArtistSettingsByUsername(artistId);

  if (!artist) {
    notFound();
  }

  const loggedInArtist = await getArtistId();
  if (loggedInArtist.artistId !== artist.id) redirect("/feed");

  const maskedEmail = maskEmail(artist.email);

  return (
    <Modal>
      <div className="mt-12 flex flex-col items-center">
        <p
          className="text-border mb-12 text-center text-32 text-blue"
          data-text="Settings"
        >
          Settings
        </p>
        <ArtistCircle
          size="large"
          username={artist.username}
          avatarUrl={artist.avatar}
        />
        <p className="mt-8 text-29 text-black">Username: @{artist.username}</p>
        <p className="text-29 text-black">Email: {maskedEmail}</p>
        {artist.emailVerified ? (
          <p
            className={`mb-10 mt-8 cursor-default text-29 capitalize text-blue`}
          >
            Email verified
          </p>
        ) : (
          <form action={verifyEmail}>
            <button
              type="submit"
              className={`mb-10 mt-8 text-29 capitalize text-pink underline cursor-pointer`}
            >
              Email not verified!
            </button>
          </form>
        )}

        <form action={logoutAction}>
          <BoxButton>
            <p
              className="text-border px-12 py-2 font-zyzol text-38 uppercase cursor-pointer"
              data-text="Log out"
            >
              Log out
            </p>
          </BoxButton>
        </form>
      </div>
    </Modal>
  );
};

export default Settings;
