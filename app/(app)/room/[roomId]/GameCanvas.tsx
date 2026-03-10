"use client";

import { useEffect, useRef, useState } from "react";
import Toolbox from "./components/game-canvas/Toolbox";
import Image from "next/image";
import UndoSVG from "@/app/assets/misc/undo.svg";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import FullLogo from "@/app/assets/logos/full_both_logo.svg";
import BoxLabel from "@/app/components/ui/BoxLabel";
import Text from "@/app/components/Text";
import { Artist } from "@/app/generated/prisma/client";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

interface GameCanvasProps {
  roomId: string;
  artists: Artist[];
}

const MAX_UNDO_STEPS = 20;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function GameCanvas({ roomId, artists }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [color, setColor] = useState("#f42398");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"pencil" | "eraser">("pencil");

  const prevPos = useRef<{ x: number; y: number } | null>(null);

  const executeStroke = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    strokeColor: string,
    size: number,
  ) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.stroke();
  };

  const executeDot = (x: number, y: number, dotColor: string, size: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
  };

  const executeFill = (fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const executeUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const previus = historyRef.current.pop();
    if (!previus) return;

    ctx.putImageData(previus, 0, 0);
    setCanUndo(historyRef.current.length > 0);
  };

  const handleUndoClick = () => {
    executeUndo();

    channelRef.current?.send({
      type: "broadcast",
      event: "undo_canvas",
    });
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_UNDO_STEPS) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 0);
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCoordinates(e);
    if (!pos) return;

    pushHistory();

    channelRef.current?.send({
      type: "broadcast",
      event: "start_drawing",
    });

    const actualColor = activeTool === "eraser" ? "#ffffff" : color;

    executeDot(pos.x, pos.y, actualColor, brushSize);

    channelRef.current?.send({
      type: "broadcast",
      event: "draw_dot",
      payload: { x: pos.x, y: pos.y, color: actualColor, size: brushSize },
    });

    setIsDrawing(true);
    prevPos.current = pos;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const currentPos = getCoordinates(e);
    if (!currentPos || !prevPos.current) return;

    const actualColor = activeTool === "eraser" ? "#ffffff" : color;

    executeStroke(
      prevPos.current.x,
      prevPos.current.y,
      currentPos.x,
      currentPos.y,
      actualColor,
      brushSize,
    );

    channelRef.current?.send({
      type: "broadcast",
      event: "draw_stroke",
      payload: {
        x0: prevPos.current.x,
        y0: prevPos.current.y,
        x1: currentPos.x,
        y1: currentPos.y,
        color: actualColor,
        size: brushSize,
      },
    });

    prevPos.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPos.current = null;
  };

  const fillCanvas = () => {
    pushHistory();

    executeFill(color);

    channelRef.current?.send({
      type: "broadcast",
      event: "fill_canvas",
      payload: { color },
    });
  };

  useEffect(() => {
    const channel = supabase.channel(`room_game_${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "draw_stroke" }, ({ payload }) => {
        executeStroke(
          payload.x0,
          payload.y0,
          payload.x1,
          payload.y1,
          payload.color,
          payload.size,
        );
      })
      .on("broadcast", { event: "draw_dot" }, ({ payload }) => {
        executeDot(payload.x, payload.y, payload.color, payload.size);
      })
      .on("broadcast", { event: "fill_canvas" }, ({ payload }) => {
        executeFill(payload.color);
      })
      .on("broadcast", { event: "undo_canvas" }, () => {
        executeUndo();
      })
      .on("broadcast", { event: "start_drawing" }, () => {
        pushHistory();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <>
      <Image
        src={FullLogo}
        alt="Full Logo"
        className="-mt-20 mx-auto mb-12 w-108"
      />
      <BoxLabel className="w-fit text-6xl ml-35" degree={1.2}>
        <Text className="px-8 py-4" largeShadow>
          A blue man in a purple jacket.
        </Text>
      </BoxLabel>

      <div className="mt-10 flex gap-10" data-room-id={roomId}>
        <aside className="flex flex-col">
          <div>
            {artists.map((artist) => (
              <ArtistCircle
                key={artist.id}
                username={artist.username}
                className="not-first:-mt-10"
              />
            ))}
          </div>

          <button
            className="mt-auto flex flex-col items-center justify-center"
            onClick={handleUndoClick}
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

          <div className="flex flex-col items-center">
            <BoxLabel className="w-fit my-10">
              <Text className="px-8 py-4 text-8xl" largeShadow>
                02:30
              </Text>
            </BoxLabel>
            <Text className="text-blue! text-5xl">Timer</Text>
          </div>
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
