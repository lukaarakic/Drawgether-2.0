interface WindowProps {
  index: number
  text: string
  type: "rule" | "play"
  details?: string
  style?: any
}

const Window = ({ index, text, type, details, style }: WindowProps) => {
  return (
    <div
      className={
        type === "rule"
          ? `floatAnimation absolute max-h-[22rem] w-[36rem] `
          : "floatAnimationSmall"
      }
      style={style}
    >
      <div
        className={`border-only flex h-24 items-center ${type === "rule" ? "justify-between rounded-t-[3.5rem] bg-blue px-8" : "w-28 justify-center rounded-t-full border-b-0 bg-pink"}`}
      >
        <span
          className="text-border drop-shadow-filter-lg text-25 text-white"
          data-text={`${index}.`}
        >
          {index}.
        </span>

        {type === "rule" ? <img src={details} alt="" /> : null}
      </div>

      <div
        className={`border-only flex h-64 items-center bg-white ${type === "rule" ? "border-t-0 py-8" : "w-[40rem] justify-center"}`}
      >
        <p
          className={`text-border text-border-lg drop-shadow-filter-lg mx-auto text-40 text-white ${type === "rule" ? "w-[27.6rem]" : "w-[33.3rem]"}`}
          data-text={text}
        >
          {text}
        </p>
      </div>
    </div>
  )
}
export default Window
