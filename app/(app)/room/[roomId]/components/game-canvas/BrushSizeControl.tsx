import type { CSSProperties } from "react";

interface BrushSizeControlProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
}

const BrushSizeControl = ({
  brushSize,
  setBrushSize,
}: BrushSizeControlProps) => {
  const sliderProgress = ((brushSize - 1) / (50 - 1)) * 100;

  return (
    <div className="flex flex-col items-center justify-center gap-1 mb-6 w-full">
      <label
        htmlFor="brushSize"
        className="text-center text-4xl leading-none mb-5"
      >
        Brush Size
      </label>
      <div
        className="w-full"
        style={{
          boxShadow: "6px 6px 0 0 #212121",
        }}
      >
        <input
          id="brushSize"
          type="range"
          min={1}
          max={50}
          className="w-full game-slider"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          style={
            {
              "--slider-progress": `${sliderProgress}%`,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
};

export default BrushSizeControl;
