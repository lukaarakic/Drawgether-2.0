import Text from "@/app/components/Text";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import Image from "next/image";
import BoxButton from "@/app/components/ui/BoxButton";
import ExitIcon from "@/app/assets/misc/exit.svg";
import CopyIcon from "@/app/assets/misc/copy.svg";

const Lobby = () => {
  return (
    <div className="grid grid-cols-2 mt-50 gap-16">
      <div className="box-shadow bg-pink rotate-2 px-10 py-5 min-w-2xl max-w-3xl">
        <div className="flex items-center gap-2 text-4xl not-last-of-type:border-b border-black first-of-type:pb-5 not-first-of-type:py-10">
          <ArtistCircle username="netrunners" />

          <Text className="text-blue! ml-4">@netrunners</Text>
          <Text className="uppercase">(YOU)</Text>
        </div>

        <div className="flex items-center gap-2 text-4xl not-last-of-type:border-b border-black py-5">
          <ArtistCircle username="mia" />

          <Text className="text-blue! ml-4">@mia</Text>
          <button className="ml-auto cursor-pointer">
            <Image src={ExitIcon} alt="Exit icon" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-12 not-first-of-type:py-12 justify-center">
          <Text className="uppercase">?</Text>
        </div>

        <div className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-12 not-first-of-type:py-12 justify-center">
          <Text className="uppercase">?</Text>
        </div>

        <div className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-12 not-first-of-type:py-12 justify-center">
          <Text className="uppercase">?</Text>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between">
        <div className="flex items-center gap-8">
          <input
            className="input -rotate-2 w-fit"
            placeholder="Insert lobby code"
          />
          <BoxButton className="font-outline text-7xl px-8 py-4 rotate-3! uppercase">
            Join
          </BoxButton>
        </div>

        <div>
          <Text
            className="uppercase text-blue! text-[5rem] leading-tight"
            largeShadow
          >
            Lobby code:
          </Text>
          <div className="flex items-center">
            <Text className="text-[5rem] leading-tight" largeShadow>
              #Aa3x5s
            </Text>
            <Image
              src={CopyIcon}
              alt="Copy icon"
              className="inline-block ml-4 cursor-pointer"
            />
          </div>
        </div>

        <button className="box-shadow flex aspect-square px-10 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90">
          <div className="rotate-10 text-7xl text-white">Start</div>
        </button>
      </div>
    </div>
  );
};

export default Lobby;
