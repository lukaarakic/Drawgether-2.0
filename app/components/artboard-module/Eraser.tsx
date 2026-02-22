const Eraser = ({
  setType,
  type,
}: {
  setType: React.Dispatch<React.SetStateAction<toolType>>
  type: toolType
}) => {
  return (
    <button
      onClick={() =>
        setType((prev) => (prev === "eraser" ? "pencil" : "eraser"))
      }
      className={`box-shadow text-border text-border-lg mb-4 rotate-[-2.36deg] ${type === "eraser" ? "bg-blue" : "bg-pink"}  px-4 text-36 uppercase text-white`}
      data-text="eraser"
    >
      eraser
    </button>
  )
}
export default Eraser
