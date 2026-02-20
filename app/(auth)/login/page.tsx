import BoxButton from "@/app/components/ui/BoxButton";
import Spinner from "@/app/components/ui/Spinner/Spinner";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Drawgether | Login",
  description: "Login into drawgether",
};

export default function Login() {
  return (
    <div className="flex flex-col">
      <form
        aria-label="login"
        method="POST"
        className="mb-8 flex flex-col items-center gap-4"
      >
        <input
          placeholder="lets@drawgether.com"
          className="input rotate-[1.4deg]"
        />

        <input
          type="password"
          placeholder="********"
          className="input mb-4 -rotate-[1.18deg]"
        />

        <div>
          <div className="checkbox">
            <input type="checkbox" id="remember-me" className="check" />
            <label
              htmlFor="remember-me"
              className="flex items-center justify-center"
            >
              <svg
                width="50"
                height="50"
                viewBox="0 0 100 100"
                className="drop-shadow-filter"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={28}
                  strokeWidth="4"
                  stroke="#212121"
                  fill="#ffffff"
                />
                <g transform="translate(0,-952.36222)">
                  <path
                    d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4 "
                    stroke="#de6b9b"
                    strokeWidth="5"
                    fill="none"
                    className="path1"
                  />
                </g>
              </svg>
              <span
                className="text-border text-border-sm text-20 text-white"
                data-text="Remember me?"
              >
                Remember me?
              </span>
            </label>
          </div>
        </div>

        <BoxButton degree={1.35} type="submit" className="px-32">
          <p className={`text-60`}>Log in</p>
        </BoxButton>
      </form>

      <div className="flex flex-col text-center text-25 text-white">
        <p
          data-text="Don’t have an account?"
          className="text-border text-border-sm"
        >
          Don’t have an account?{" "}
          <Link
            href={"/register"}
            className="text-border text-border-sm text-pink underline"
            data-text="Register."
          >
            Register.
          </Link>
        </p>
        <p
          data-text="Forgot your password?"
          className="text-border text-border-sm"
        >
          Forgot your password?{" "}
          <Link
            href={"/forgot-password"}
            className="text-border text-border-sm text-pink underline"
            data-text="Reset it."
          >
            Reset it.
          </Link>
        </p>
      </div>
    </div>
  );
}
