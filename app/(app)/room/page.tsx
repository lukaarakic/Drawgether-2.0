import FullLogo from "@/app/assets/logos/full_both_logo.svg";
import { createRoom } from "@/app/lib/actions/room";
import Image from "next/image";
import Link from "next/link";

const Room = () => {
  return (
    <>
      <div className="h-calc flex flex-col items-center justify-evenly">
        <Image src={FullLogo} alt="" className="h-[30svh]" />

        <form action={createRoom}>
          <button className="box-shadow flex h-[17svh] w-[17svh] items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90">
            <div className="rotate-10 text-[3.5svh] text-white">Draw!</div>
          </button>
        </form>
        <Link
          href={"/tutorial"}
          className="text-border text-border-lg box-shadow -rotate-3 bg-blue p-4 px-8 text-45 text-white transition-transform hover:scale-105 active:scale-90"
          data-text="Tutorial"
        >
          Tutorial
        </Link>

        <noscript>
          <h1 className="text-25">
            This game will not work properly without javascript 😢
          </h1>
        </noscript>
      </div>
    </>
  );
};
export default Room;
