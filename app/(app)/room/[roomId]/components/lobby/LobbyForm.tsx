import BoxButton from "@/app/components/ui/BoxButton";
import { joinRoomAction } from "@/app/lib/actions/room";
import { useActionState } from "react";

const LobbyForm = () => {
  const initialState = { message: "" };
  const [state, action, isPending] = useActionState(
    joinRoomAction,
    initialState,
  );

  return (
    <form action={action} className="flex items-center gap-8 mb-40">
      <input
        className="input -rotate-2 w-fit"
        placeholder="Insert lobby code"
        name="roomId"
      />

      {state.message && <p className="text-red text-4xl">{state.message}</p>}
      <BoxButton
        className="font-outline text-7xl px-8 py-4 rotate-3! uppercase disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? "Joining..." : "Join"}
      </BoxButton>
    </form>
  );
};

export default LobbyForm;
