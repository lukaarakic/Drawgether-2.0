import { useFetcher } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"
import { conform, useForm } from "@conform-to/react"
import { getFieldsetConstraint, parse } from "@conform-to/zod"

import { type action as commentAction } from "~/routes/comment.$artworkId"
import { CommentSchema } from "~/utils/social-function.server"
import CommentList from "./CommentList"
import ErrorList from "../error/ErrorList"
import Spinner from "../ui/Spinner/Spinner"

const CommentContainer = ({
  artwork,
  artworkId,
}: {
  artwork: {
    comments: {
      id: string
      content: string
      artist: {
        id: string
        avatar: string | null
        username: string
      }
    }[]
  }
  artworkId: string
}) => {
  const fetcher = useFetcher<typeof commentAction>()
  const isPending = fetcher.state === "submitting"

  const [form, fields] = useForm({
    id: "post-comment-form",
    constraint: getFieldsetConstraint(CommentSchema),
    lastSubmission: fetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: CommentSchema })
    },
  })

  return (
    <>
      <div className="mt-12 flex flex-col items-center">
        <p
          className="text-border mb-12 -rotate-2 text-center text-32 text-blue"
          data-text="Comments"
        >
          Comments
        </p>

        <CommentList comments={artwork.comments} />

        <fetcher.Form
          method="POST"
          action={`/comment/${artworkId}`}
          {...form.props}
        >
          <AuthenticityTokenInput />
          <div className="flex items-center justify-center gap-8">
            <input
              type="text"
              className="input h-20 w-[29rem] px-8 py-10 text-20"
              placeholder="Your comment..."
              {...conform.input(fields.content)}
            />

            <button
              disabled={isPending}
              type="submit"
              className="box-shadow flex h-28 w-28 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90"
            >
              <div
                className={`text-16 text-white ${isPending ? "animate-spin" : ""}`}
              >
                {isPending ? <Spinner className="h-24 w-24" /> : "Post"}
              </div>
            </button>
          </div>
          <div className="flex items-center justify-center">
            <ErrorList
              errors={fields.content.errors}
              id={fields.content.errorId}
            />
          </div>
        </fetcher.Form>
      </div>
    </>
  )
}
export default CommentContainer
