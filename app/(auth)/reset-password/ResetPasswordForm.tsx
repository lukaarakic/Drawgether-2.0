"use client";

import ErrorList from "@/app/components/error/ErrorList";
import BoxButton from "@/app/components/ui/BoxButton";
import {
  resetPassword,
  ResetPasswordState,
} from "@/app/lib/actions/reset-passoword";
import { useActionState } from "react";

function ResetPasswordForm() {
  const intialState: ResetPasswordState = {
    errors: {},
    message: "",
  };

  const [state, action, isPending] = useActionState(resetPassword, intialState);

  return (
    <form action={action} className="flex flex-col items-center gap-4">
      <input
        type="text"
        className="input"
        placeholder="New password"
        name="newPassword"
      />
      <ErrorList errors={state.errors?.newPassword} />
      <input
        type="text"
        className="input"
        placeholder="Confirm new password"
        name="confirmPassword"
      />
      <ErrorList errors={state.errors?.confirmPassword} />
      <ErrorList errors={state.message ? [state.message] : []} />

      <BoxButton
        type="submit"
        className="mt-4 h-min w-min"
        disabled={isPending}
      >
        <p className="px-8 py-1 text-40">Submit</p>
      </BoxButton>
    </form>
  );
}

export default ResetPasswordForm;
