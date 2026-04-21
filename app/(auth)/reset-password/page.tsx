import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Drawgether account.",
};

export default async function ResetPasswordPage() {
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
          data-text={`Hi, no worries! It happens all the time 💪`}
        >
          Hi, no worries! It happens all the time 💪
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
