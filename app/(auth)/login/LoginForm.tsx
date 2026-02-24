"use client";

import { AuthState } from "@/app/lib/actions/register";
import { loginAction } from "@/app/lib/actions/login";
import { useActionState } from "react";
import ErrorList from "@/app/components/error/ErrorList";
import BoxButton from "@/app/components/ui/BoxButton";
import Spinner from "@/app/components/ui/Spinner/Spinner";
import HoneypotField from "@/app/components/ui/HoneypotField";

const LoginForm = () => {
  const initalState: AuthState = { errors: {}, message: "" };

  const [state, action, isPending] = useActionState(loginAction, initalState);

  return (
    <form
      action={action}
      aria-label="login"
      className="mb-8 flex flex-col items-center gap-4"
    >
      <input
        placeholder="lets@drawgether.com"
        className="input rotat`e-[1.4deg]"
        name="email"
      />
      {state.errors.email && <ErrorList errors={state.errors.email} />}

      <input
        type="password"
        placeholder="********"
        className="input mb-4 -rotate-[1.18deg]"
        name="password"
      />
      {state.errors.password && <ErrorList errors={state.errors.password} />}

      <HoneypotField />

      <div>
        <div className="checkbox">
          <input
            type="checkbox"
            name="rememberMe"
            id="remember-me"
            className="check"
          />
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

      {state.message && <ErrorList errors={[state.message]} />}

      <BoxButton degree={1.35} type="submit" className="px-32">
        <p className={`text-60`}>{isPending ? <Spinner /> : "Login"}</p>
      </BoxButton>
    </form>
  );
};

export default LoginForm;
