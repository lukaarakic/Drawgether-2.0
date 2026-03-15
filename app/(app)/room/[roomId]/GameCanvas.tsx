"use client";

import { useEffect, useRef, useState } from "react";
import Toolbox from "./components/game-canvas/Toolbox";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { finishGameAction } from "@/app/lib/actions/room";
import GameCanvasHeader from "./components/game-canvas/GameCanvasHeader";
import PlayerSidebar from "./components/game-canvas/PlayerSidebar";
import CanvasStage from "./components/game-canvas/CanvasStage";
import BoxLabel from "@/app/components/ui/BoxLabel";
import Text from "@/app/components/Text";
import { Artist } from "@/drizzle/schema";

interface GameCanvasProps {
  roomId: string;
  artists: Artist[];
  theme: string | null;
  expiresAt: string | null;
  roomDatabaseId: string;
}

const MAX_UNDO_STEPS = 20;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function GameCanvas({
  roomId,
  artists,
  theme,
  expiresAt,
  roomDatabaseId,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [color, setColor] = useState("#f42398");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"pencil" | "eraser">("pencil");

  const prevPos = useRef<{ x: number; y: number } | null>(null);
  const [gameNow, setGameNow] = useState(() => Date.now());
  const [artworkSaved, setArtworkSaved] = useState(false);

  const safeDateString = expiresAt
    ? expiresAt.endsWith("Z")
      ? expiresAt
      : `${expiresAt}Z`
    : null;
  const gamesEndsAt = safeDateString
    ? new Date(safeDateString).getTime()
    : null;
  const remainingSeconds = gamesEndsAt
    ? Math.max(0, Math.ceil((gamesEndsAt - gameNow) / 1000))
    : 5 * 60;

  console.log(
    "Expires At:",
    expiresAt,
    "Games ends at:",
    gamesEndsAt,
    "Current time:",
    gameNow,
    "Remaining seconds:",
    remainingSeconds,
  );
  const isTimeUp = gamesEndsAt !== null && remainingSeconds <= 0;
  const formattedTime = `${Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(remainingSeconds % 60).toString().padStart(2, "0")}`;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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

    e.currentTarget.setPointerCapture(e.pointerId);

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

  const stopDrawing: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (isTimeUp) return;

    const intervalId = window.setInterval(() => {
      setGameNow(Date.now());
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [isTimeUp]);

  useEffect(() => {
    if (!isTimeUp || artworkSaved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const base64 = canvas.toDataURL("image/png");
    finishGameAction(roomDatabaseId, roomId, base64)
      .then(() => setArtworkSaved(true))
      .catch((err) => console.error("Error saving artwork:", err));
  }, [isTimeUp, artworkSaved, roomDatabaseId, roomId]);

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
    <div className="flex flex-col px-4 sm:px-5 mt-20">
      {/* <Image
        src={FullLogo}
        alt="Full Logo"
        className="mx-auto mb-12 w-108 hidden lg:block"
      /> */}
      <GameCanvasHeader theme={theme} />

      <div
        className="mt-8 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:gap-10"
        data-room-id={roomId}
      >
        <PlayerSidebar
          artists={artists}
          canUndo={canUndo}
          onUndo={handleUndoClick}
        />

        <CanvasStage
          canvasRef={canvasRef}
          isTimeUp={isTimeUp}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
        />

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
      <div className="flex flex-col items-center mt-20">
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
