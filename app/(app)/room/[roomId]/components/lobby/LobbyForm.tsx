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
    <div className="mb-40">
      <form action={action} className="flex items-center gap-8 mb-10">
        <input
          className="input w-full -rotate-2 lg:w-fit"
          placeholder="Insert lobby code"
          name="roomId"
        />

        <BoxButton
          className="font-outline text-7xl px-8 py-4 rotate-3! uppercase disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "Joining..." : "Join"}
        </BoxButton>
      </form>
      {state.message && (
        <p className="text-pink text-4xl text-center">{state.message}</p>
      )}
    </div>
  );
};

export default LobbyForm;
