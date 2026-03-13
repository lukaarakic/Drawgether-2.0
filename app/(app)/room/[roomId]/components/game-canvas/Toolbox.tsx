"use client";

import BrushSizeControl from "./BrushSizeControl";
import ColorPickerControl from "./ColorPickerControl";
import ToolActions from "./ToolActions";

interface ToolboxProps {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  activeTool: "pencil" | "eraser";
  onSelectPencil: () => void;
  onSelectEraser: () => void;
  onFill: () => void;
}

const Toolbox = ({
  color,
  setColor,
  brushSize,
  setBrushSize,
  activeTool,
  onSelectPencil,
  onSelectEraser,
  onFill,
}: ToolboxProps) => {
  return (
    <aside className="flex flex-col xs:flex-row lg:flex-col lg:justify-normal justify-between">
      <ToolActions
        activeTool={activeTool}
        onSelectPencil={onSelectPencil}
        onSelectEraser={onSelectEraser}
        onFill={onFill}
      />

      <div className="flex flex-col lg:justify-normal lg:h-full">
        <BrushSizeControl brushSize={brushSize} setBrushSize={setBrushSize} />
        <ColorPickerControl color={color} setColor={setColor} />
      </div>
    </aside>
  );
};

export default Toolbox;
