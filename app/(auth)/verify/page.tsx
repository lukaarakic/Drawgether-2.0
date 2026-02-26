"use client";

import ErrorList from "@/app/components/error/ErrorList";
/* eslint-disable react/no-unescaped-entities */
import BoxButton from "@/app/components/ui/BoxButton";
import HoneypotField from "@/app/components/ui/HoneypotField";
import Spinner from "@/app/components/ui/Spinner/Spinner";
import { VerifyState, verifyTOTPAction } from "@/app/lib/actions/verify";
import { useActionState } from "react";

const Verify = () => {
  const initialState: VerifyState = { errors: {}, message: "" };

  const [state, action, isPending] = useActionState(
    verifyTOTPAction,
    initialState,
  );

  return (
    <div className="flex flex-col items-center md:-mt-20">
      <div className="mb-20 text-center">
        <h1
          className="text-border md:text-border-lg block text-45 text-white md:text-90"
          data-text="Check your email"
        >
          Check your email
        </h1>
        <p
          className="text-border md:text-border-lg text-22 text-white opacity-90 md:-mt-4 md:text-40"
          data-text="We've sent you a code to verify your email adderss"
        >
          We've sent you a code to verify your email adderss
        </p>
      </div>

      <form action={action}>
        {/* <HoneypotField /> */}
        <div className="flex flex-col items-center xs:flex-row">
          <div className="text-center">
            <input
              type="text"
              className="input mb-4 w-full md:w-220"
              placeholder="Your code goes here"
              name="token"
            />
          </div>

          <BoxButton
            type="submit"
            className="ml-8 h-min w-min cursor-pointer"
            disabled={isPending}
          >
            {isPending ? (
              <Spinner />
            ) : (
              <p className="px-8 py-1 text-40">Submit</p>
            )}
          </BoxButton>

          <ErrorList errors={state.errors.token ?? []} id="token" />
        </div>
      </form>
      <ErrorList errors={[state.message ?? ""]} />
    </div>
  );
};
export default Verify;
