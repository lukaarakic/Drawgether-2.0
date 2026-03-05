"use client";

import BoxButton from "@/app/components/ui/BoxButton";
import { leaveRoomAction } from "@/app/lib/actions/room";
import { useActionState } from "react";

const LeaveButton = () => {
  const initialState = { message: "" };
  const [state, action, isPending] = useActionState(
    leaveRoomAction,
    initialState,
  );

  return (
    <form action={action}>
      <BoxButton className="font-outline text-7xl px-8 py-4 rotate-3! uppercase">
        Leave
      </BoxButton>
      {state.message && (
        <p className="text-red text-4xl mt-4">{state.message}</p>
      )}
    </form>
  );
};

export default LeaveButton;
