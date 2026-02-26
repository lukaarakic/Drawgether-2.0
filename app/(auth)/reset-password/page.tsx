import { cookies } from "next/headers";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const artistUsername = cookieStore.get("dg_reset_artist_username")?.value;

  if (!artistUsername) {
    throw new Error(
      "No artist information found. Please restart the password reset process.",
    );
  }

  return (
    <div className="flex flex-col items-center md:-mt-20">
      <div className="mb-20 text-center">
        <h1
          className="text-border md:text-border-lg block text-45 text-white md:text-90"
          data-text="Password reset!"
        >
          Password reset!
        </h1>
        <p
          className="text-border md:text-border-lg text-25 text-white opacity-90 md:-mt-4 md:text-40"
          data-text={`Hi ${artistUsername}, no worries! It happens all the time 💪`}
        >
          Hi {artistUsername}, no worries! It happens all the time 💪
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
