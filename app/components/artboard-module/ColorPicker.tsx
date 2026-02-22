import ShadeSlider from "@uiw/react-color-shade-slider"
import Wheel from "@uiw/react-color-wheel"

const ColorPicker = ({
  hsva,
  setHsva,
}: {
  hsva: HsvaColor
  setHsva: React.Dispatch<
    React.SetStateAction<{
      h: number
      s: number
      v: number
      a: number
    }>
  >
}) => {
  return (
    <div>
      <div className="box-shadow mb-4 flex h-64 w-64 items-center justify-center rounded-full">
        <Wheel
          className="flex-shrink-0"
          width={153}
          height={153}
          color={hsva}
          onChange={(color) => setHsva({ ...hsva, ...color.hsva })}
        />
      </div>
      <div className="box-shadow">
        <ShadeSlider
          className="fix-pointer"
          hsva={hsva}
          height={5}
          width={153}
          onChange={(newShade) => {
            setHsva({ ...hsva, ...newShade })
          }}
        />
      </div>
    </div>
  )
}
export default ColorPicker
