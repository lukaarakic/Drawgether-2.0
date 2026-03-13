import { RefObject, PointerEventHandler } from "react";
import BoxLabel from "@/app/components/ui/BoxLabel";
import Text from "@/app/components/Text";

interface CanvasStageProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isTimeUp: boolean;
  formattedTime: string;
  onPointerDown: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp: PointerEventHandler<HTMLCanvasElement>;
  onPointerOut: PointerEventHandler<HTMLCanvasElement>;
}

export default function CanvasStage({
  canvasRef,
  isTimeUp,
  formattedTime,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOut,
}: CanvasStageProps) {
  return (
    <div className="box-shadow border-4 border-black bg-white max-w-[512px] max-h-[512px] box-content">
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
        width={512}
        height={512}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerOut}
        className="touch-none cursor-crosshair"
      />

      <div className="flex flex-col items-center">
        <BoxLabel className="w-fit my-10">
          <Text className="px-8 py-4 text-8xl" largeShadow>
            {formattedTime}
          </Text>
        </BoxLabel>
        <Text className="text-blue! text-5xl">Timer</Text>
      </div>
    </div>
  );
}
