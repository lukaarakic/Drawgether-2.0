"use client";

import { useEffect, useRef, useState } from "react";
import Toolbox from "./components/game-canvas/Toolbox";
import Image from "next/image";
import UndoSVG from "@/app/assets/misc/undo.svg";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import FullLogo from "@/app/assets/logos/full_both_logo.svg";

interface GameCanvasProps {
  roomId: string;
}

const MAX_UNDO_STEPS = 20;

export default function GameCanvas({ roomId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"pencil" | "eraser">("pencil");

  const prevPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);

    // Keep memory bounded for long sessions.
    if (historyRef.current.length > MAX_UNDO_STEPS) {
      historyRef.current.shift();
    }

    setCanUndo(historyRef.current.length > 0);
  };

  const undoCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const previous = historyRef.current.pop();
    if (!previous) return;

    ctx.putImageData(previous, 0, 0);
    setCanUndo(historyRef.current.length > 0);
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCoordinates(e);
    if (!pos) return;

    pushHistory();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeTool === "eraser" ? "#ffffff" : color;
      ctx.fill();
    }

    setIsDrawing(true);
    prevPos.current = pos;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const currentPos = getCoordinates(e);
    if (!currentPos || !prevPos.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(prevPos.current.x, prevPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = brushSize;
    ctx.stroke();

    //SUPABASE BROADCAST

    prevPos.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPos.current = null;
  };

  const fillCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    pushHistory();

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      <Image src={FullLogo} alt="Full Logo" className="mx-auto w-108" />
      <div className="mt-10 flex items-stretch gap-10" data-room-id={roomId}>
        <aside className="flex flex-col">
          <div>
            <ArtistCircle username="You" />
          </div>

          <button
            className="mt-auto flex flex-col items-center justify-center"
            onClick={undoCanvas}
            disabled={!canUndo}
            aria-label="Undo last drawing action"
          >
            <p
              className="text-border text-border-lg text-25 text-pink"
              data-text="Undo"
            >
              Undo
            </p>
            <div
              className={`box-shadow flex h-32 w-32 items-center justify-center rounded-full bg-blue uppercase transition-transform ${
                canUndo ? "hover:scale-105 active:scale-90" : "opacity-60"
              }`}
            >
              <Image src={UndoSVG} alt="" className="h-24 w-24" />
            </div>
          </button>
        </aside>

        <div className="box-shadow border-4 border-black bg-white max-w-[512px] max-h-[512px] box-content">
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
            className="touch-none cursor-crosshair"
          />
        </div>
        <Toolbox
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          activeTool={activeTool}
          onSelectPencil={() => setActiveTool("pencil")}
          onSelectEraser={() => setActiveTool("eraser")}
          onFill={fillCanvas}
        />
      </div>
    </>
  );
}
