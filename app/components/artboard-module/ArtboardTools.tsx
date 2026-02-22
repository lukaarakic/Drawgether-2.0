import BrushSize from "./BrushSize"
import ColorPicker from "./ColorPicker"
import Eraser from "./Eraser"
import EyeDropper from "./Eyedropper"
import Pencil from "./Pencil"

interface ArtboardToolsProps {
  hsva: HsvaColor
  brushWidth: number
  type: toolType
  setHsva: React.Dispatch<
    React.SetStateAction<{
      h: number
      s: number
      v: number
      a: number
    }>
  >
  setBrushWidth: React.Dispatch<React.SetStateAction<number>>
  setType: React.Dispatch<React.SetStateAction<toolType>>
}

const ArtboardTools = ({
  hsva,
  brushWidth,
  setHsva,
  setBrushWidth,
  setType,
  type,
}: ArtboardToolsProps) => {
  return (
    <div className="flex flex-col items-center justify-end gap-12">
      <div className="flex flex-col gap-4">
        <Pencil setType={setType} type={type} />
        <EyeDropper setType={setType} type={type} />
        <Eraser setType={setType} type={type} />
      </div>
      <BrushSize brushWidth={brushWidth} setBrushWidth={setBrushWidth} />
      <ColorPicker hsva={hsva} setHsva={setHsva} />
    </div>
  )
}
export default ArtboardTools
