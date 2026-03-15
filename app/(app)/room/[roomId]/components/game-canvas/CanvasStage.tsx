import { RefObject, PointerEventHandler } from "react";
import { motion } from "framer-motion";

interface CanvasStageProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isTimeUp: boolean;
  onClose: () => void;
  onPointerDown: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp: PointerEventHandler<HTMLCanvasElement>;
  onPointerOut: PointerEventHandler<HTMLCanvasElement>;
}

export default function CanvasStage({
  canvasRef,
  isTimeUp,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOut,
}: CanvasStageProps) {
  return (
    <motion.div
      className="w-full mx-auto flex flex-col items-center z-50"
      initial={false}
      animate={isTimeUp ? { scale: 1.1, rotate: 2 } : { scale: 1 }}
    >
      <div className="relative box-shadow border-4 border-black  bg-white box-content w-full">
        {isTimeUp && (
          <div className="absolute flex-col inset-0 flex items-center justify-center z-10 bg-black/20">
            <button
              className="absolute top-10 right-10 text-5xl cursor-pointer"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              x
            </button>

            <p
              className="text-border text-border-lg text-blue text-[12rem] leading-none"
              data-text="TIME"
            >
              TIME
            </p>
            <p
              className="text-border text-border-lg text-blue text-[12rem] leading-none"
              data-text="IS"
            >
              IS
            </p>
            <p
              className="text-border text-border-lg text-pink text-[12rem] leading-none"
              data-text="UP!"
            >
              UP!
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
    </motion.div>
  );
}
