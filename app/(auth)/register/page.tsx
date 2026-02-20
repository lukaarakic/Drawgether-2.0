import BoxButton from "@/app/components/ui/BoxButton";
import Image from "next/image";
import Link from "next/link";

const RegisterPage = () => {
  return (
    <div>
      <form
        aria-label="sign-up"
        method="POST"
        className="mb-12 flex flex-col items-center gap-4 text-20"
      >
        <div className="relative text-center">
          <div className="border-only absolute -top-2 left-0 z-10 flex h-32 w-32 items-center justify-center rounded-full bg-white">
            <Image
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=drawgether`}
              alt="Usernames avatar"
              width={60}
              height={60}
              unoptimized
            />
          </div>

          <input
            type="text"
            placeholder="Username"
            className={`input rotate-[1.4deg] pl-40`}
          />
          <div className="w-220">{/* Error */}</div>
        </div>

        <div className="text-center">
          <input
            type="email"
            placeholder="lets@drawgether.com"
            className={`input -rotate-[1.18deg]`}
          />
        </div>

        <div className="text-center">
          <input
            type="password"
            placeholder="********"
            className="input mb-4 rotate-[1.7deg]"
          />
        </div>

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

        <BoxButton degree={1} type="submit" className="px-32">
          <p className={`text-60 `}>Register</p>
        </BoxButton>
      </form>

      <div className="text-center text-25 text-white">
        <p
          className="text-border text-border-sm"
          data-text="Already registered? "
        >
          Already registered?{" "}
          <Link
            href={"/login"}
            className="text-border text-border-sm text-pink underline"
            data-text="Log in."
          >
            Log in.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
