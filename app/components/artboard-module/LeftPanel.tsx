import ArtistCircle from "../ui/ArtistCircle"
import UndoSVG from "~/assets/misc/undo.svg"
import { useArtist } from "~/utils/artist"

const LeftPanel = ({ undo }: { undo: () => void }) => {
  const artist = useArtist()

  return (
    <div className="flex w-[17rem] flex-col items-start justify-between">
      <ArtistCircle
        className="ml-auto"
        avatar={{ avatarUrl: artist.avatar, seed: artist.username }}
        size={8.3}
      />

      <button
        className="ml-auto flex flex-col items-center justify-center"
        onClick={undo}
      >
        <p
          className="text-border text-border-lg text-25 text-pink"
          data-text="Undo"
        >
          Undo
        </p>
        <div className="box-shadow flex h-32 w-32 items-center justify-center rounded-full bg-blue uppercase transition-transform hover:scale-105 active:scale-90">
          <img src={UndoSVG} alt="" className="h-24 w-24" />
        </div>
      </button>
    </div>
  )
}
export default LeftPanel
