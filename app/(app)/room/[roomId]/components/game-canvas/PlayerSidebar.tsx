import Image from "next/image";
import UndoSVG from "@/app/assets/misc/undo.svg";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import { Artist } from "@/app/generated/prisma/client";

interface PlayerSidebarProps {
  artists: Artist[];
  canUndo: boolean;
  onUndo: () => void;
}

export default function PlayerSidebar({
  artists,
  canUndo,
  onUndo,
}: PlayerSidebarProps) {
  return (
    <aside className="flex items-center justify-between lg:flex-col">
      <div>
        {artists.map((artist) => (
          <ArtistCircle
            key={artist.id}
            username={artist.username}
            className="lg:not-first:-mt-10"
          />
        ))}
      </div>

      <button
        className="mt-auto flex flex-col items-center justify-center"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last drawing action"
      >
        <p
          className="text-border text-border-lg text-25 text-pink"
          data-text="Undo"
        >
          Undo
        </p>
        <div
          className={`box-shadow flex h-32 w-32 items-center justify-center rounded-full bg-blue uppercase transition-transform ${
            canUndo ? "hover:scale-105 active:scale-90" : "opacity-60"
          }`}
        >
          <Image src={UndoSVG} alt="" className="h-24 w-24" />
        </div>
      </button>
    </aside>
  );
}
