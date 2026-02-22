import generateRandomRotation from "~/utils/generate-random-rotation"

const BrushSize = ({
  brushWidth,
  setBrushWidth,
}: {
  brushWidth: number
  setBrushWidth: React.Dispatch<React.SetStateAction<number>>
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <label htmlFor="brushSize" className="text-center text-16 leading-none">
        Brush Size
      </label>
      <input
        id="brushSize"
        type="range"
        min={1}
        max={100}
        className="slider"
        defaultValue={brushWidth}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setBrushWidth(+e.target.value)
        }
        style={{
          rotate: `${generateRandomRotation(new Date().getHours() % 12)}deg`,
        }}
      />
    </div>
  )
}
export default BrushSize
