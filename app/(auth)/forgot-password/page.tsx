import BoxButton from "@/app/components/ui/BoxButton";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Password Recovery for Drawgether",
};

const ForgotPassword = () => {
  return (
    <div className="flex flex-col items-center md:-mt-20">
      <div className="mb-20 text-center">
        <h1
          className="text-border md:text-border-lg block text-45 text-white md:text-90"
          data-text="Forgot password?"
        >
          Forgot password?
        </h1>
        <p
          className="text-border md:text-border-lg text-25 text-white opacity-90 md:-mt-4 md:text-40"
          data-text="No problem! Reset instructions on the way!"
        >
          No problem! Reset instructions on the way!
        </p>
      </div>

      <form method="POST">
        <div className="mb-16 flex flex-col items-center">
          <div className="mb-10 text-center">
            <input
              type="text"
              className="input mb-4 w-full md:w-220"
              placeholder="Usename or Email"
            />
          </div>

          <BoxButton type="submit" className="h-min w-min">
            <p className="px-8 py-1 text-40 md:px-16 md:text-60">Submit</p>
          </BoxButton>
        </div>
      </form>

      <p data-text="Back to" className="text-border mt-8 text-25 text-white">
        Back to{" "}
        <Link
          href={"/login"}
          className="text-border text-pink"
          data-text="Login"
        >
          Login
        </Link>
      </p>
    </div>
  );
};
export default ForgotPassword;
