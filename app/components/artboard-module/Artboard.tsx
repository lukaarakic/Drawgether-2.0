import { useState } from "react"
import LeftPanel from "./LeftPanel"
import Canvas from "./Canvas"
import ArtboardTools from "./ArtboardTools"
import { useDraw } from "~/utils/canvas-functions"

const Artboard = ({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>
}) => {
  const [hsva, setHsva] = useState({ h: 0, s: 0, v: 100, a: 1 })
  const [brushWidth, setBrushWidth] = useState(5)
  const [type, setType] = useState<toolType>("pencil")

  const { handleMouseDown, handleMouseMove, handleMouseUp, undo, handleClick } =
    useDraw({
      brushWidth,
      hsva,
      canvasRef,
      type,
      setHsva,
    })

  return (
    <div className="flex gap-8">
      <LeftPanel undo={undo} />
      <Canvas
        canvasRef={canvasRef}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleClick={handleClick}
      />
      <ArtboardTools
        brushWidth={brushWidth}
        hsva={hsva}
        type={type}
        setBrushWidth={setBrushWidth}
        setHsva={setHsva}
        setType={setType}
      />
    </div>
  )
}
export default Artboard
