const EyeDropper = ({
  setType,
  type,
}: {
  setType: React.Dispatch<React.SetStateAction<toolType>>
  type: toolType
}) => {
  return (
    <button
      onClick={() =>
        setType((prev) => (prev === "eyedropper" ? "pencil" : "eyedropper"))
      }
      className={`box-shadow text-border text-border-lg mb-4 rotate-2 ${type === "eyedropper" ? "bg-blue" : "bg-pink"}  px-4 text-36 uppercase text-white`}
      data-text="Eyedropper"
    >
      Eyedropper
    </button>
  )
}
export default EyeDropper
