import { Link, useFetcher } from "@remix-run/react"

import ArtistCircle from "../ui/ArtistCircle"
import BoxLabel from "../ui/BoxLabel"
import TrashSVG from "~/assets/misc/trash.svg"
import { useArtist } from "~/utils/artist"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"
import { artistHasRole } from "~/utils/permissions"

export default function Comment({
  comment,
}: {
  comment: {
    id: string
    content: string
    artist: {
      id: string
      username: string
      avatar: string | null
    }
  }
}) {
  const fetcher = useFetcher()
  const isPending = fetcher.state === "submitting"
  const artist = useArtist()
  const isAdmin = artistHasRole(artist, "admin")

  const isOwner = comment.artist.id === artist.id

  return (
    <div className="mb-24 flex items-start gap-5 overflow-hidden">
      <Link to={`/artist/${comment.artist.username}`} className="flex-shrink-0">
        <ArtistCircle
          size={6}
          avatar={{
            avatarUrl: comment.artist.avatar,
            seed: comment.artist.username,
          }}
        />
      </Link>

      <div>
        <div className="flex items-center gap-8">
          <BoxLabel>
            <p
              className="text-border py-2 text-justify text-16"
              data-text={`@${comment.artist.username}`}
            >
              @{comment.artist.username}{" "}
            </p>
          </BoxLabel>

          {isOwner || isAdmin ? (
            <fetcher.Form
              method="POST"
              action={`/delete-comment/${comment.id}`}
            >
              <AuthenticityTokenInput />
              <button type="submit">
                <img
                  src={TrashSVG}
                  alt=""
                  className={`w-12 ${isPending ? "animate-spin" : ""}`}
                />
              </button>
            </fetcher.Form>
          ) : null}
        </div>
        <p className="mt-4 w-[40rem] break-words text-22 leading-none text-black">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
