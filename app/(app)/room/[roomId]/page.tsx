import Text from "@/app/components/Text";
import ArtistCircle from "@/app/components/ui/ArtistCircle";

const Lobby = () => {
  return (
    <div className="grid grid-cols-2 mt-50">
      <div className="box-shadow bg-pink rotate-2 px-10 py-5 min-w-2xl">
        <div className="flex items-center gap-2 text-4xl not-last-of-type:border-b border-black first-of-type:pb-10 not-first-of-type:py-10">
          <ArtistCircle username="netrunners" />

          <Text className="text-blue! ml-4">@netrunners</Text>
          <Text className="uppercase">(YOU)</Text>
        </div>

        <div className="flex items-center gap-2 text-4xl not-last-of-type:border-b border-black py-10">
          <ArtistCircle username="mia" />

          <Text className="text-blue! ml-4">@mia</Text>
        </div>

        <div className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-10 not-first-of-type:py-10 justify-center">
          <Text className="uppercase">?</Text>
        </div>

        <div className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-10 not-first-of-type:py-10 justify-center">
          <Text className="uppercase">?</Text>
        </div>

        <div className="flex items-center gap-2 text-6xl not-last-of-type:border-b border-black first-of-type:pb-10 not-first-of-type:py-10 justify-center">
          <Text className="uppercase">?</Text>
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default Lobby;
