const Pencil = ({
  setType,
  type,
}: {
  setType: React.Dispatch<React.SetStateAction<toolType>>
  type: toolType
}) => {
  return (
    <button
      onClick={() => setType("pencil")}
      className={`box-shadow text-border text-border-lg mb-4 rotate-[-3.27deg] ${type === "pencil" ? "bg-blue" : "bg-pink"}  px-4 text-36 uppercase text-white`}
      data-text="Pencil"
    >
      Pencil
    </button>
  )
}
export default Pencil
