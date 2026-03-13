import { RefObject, PointerEventHandler } from "react";

interface CanvasStageProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isTimeUp: boolean;
  onPointerDown: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp: PointerEventHandler<HTMLCanvasElement>;
  onPointerOut: PointerEventHandler<HTMLCanvasElement>;
}

export default function CanvasStage({
  canvasRef,
  isTimeUp,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOut,
}: CanvasStageProps) {
  return (
    <div className="w-full mx-auto flex flex-col items-center">
      <div className="relative box-shadow border-4 border-black bg-white box-content w-full">
        {isTimeUp && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <p
              className="text-border text-border-lg text-white text-7xl -rotate-6"
              data-text="Time Is Up!"
            >
              Time Is Up!
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOut={onPointerOut}
          className="block w-full h-auto aspect-square touch-none cursor-crosshair"
        />
      </div>
    </div>
  );
}
