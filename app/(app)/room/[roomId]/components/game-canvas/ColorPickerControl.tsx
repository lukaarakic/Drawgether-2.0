import { ShadeSlider, Wheel, hexToHsva, hsvaToHex } from "@uiw/react-color";

interface ColorPickerControlProps {
  color: string;
  setColor: (color: string) => void;
}

const ColorPickerControl = ({ color, setColor }: ColorPickerControlProps) => {
  const hsva = hexToHsva(color);

  return (
    <div className="fix-pointer flex flex-col items-center gap-3 mt-auto">
      <Wheel
        color={color}
        onChange={(c) => setColor(c.hex)}
        width={180}
        height={180}
      />
      <ShadeSlider
        className="game-slider"
        hsva={hsva}
        onChange={(c) => setColor(hsvaToHex({ ...hsva, v: c.v }))}
        style={{ width: 220, border: "4px solid #212121" }}
      />
    </div>
  );
};

export default ColorPickerControl;
