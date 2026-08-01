"use client";

import { useEffect, useRef, useState } from "react";
import Toolbox from "./components/game-canvas/Toolbox";
import { RoomSocket } from "@/app/lib/realtime-client";
import { mintRealtimeToken } from "@/app/lib/actions/realtime-token";
import { finishGameAction } from "@/app/lib/actions/room";
import GameCanvasHeader from "./components/game-canvas/GameCanvasHeader";
import PlayerSidebar from "./components/game-canvas/PlayerSidebar";
import CanvasStage from "./components/game-canvas/CanvasStage";
import BoxLabel from "@/app/components/ui/BoxLabel";
import Text from "@/app/components/Text";
import { Artist } from "@/drizzle/schema";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface GameCanvasProps {
  roomId: string;
  artists: Artist[];
  theme: string | null;
  expiresAt: string | null;
  roomDatabaseId: string;
}

const MAX_UNDO_STEPS = 20;
const STROKE_FLUSH_MS = 40;

type StrokeSegment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
};

export default function GameCanvas({
  roomId,
  artists,
  theme,
  expiresAt,
  roomDatabaseId,
}: GameCanvasProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const channelRef = useRef<RoomSocket | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const strokeBufferRef = useRef<StrokeSegment[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [color, setColor] = useState("#f42398");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"pencil" | "eraser">("pencil");

  const prevPos = useRef<{ x: number; y: number } | null>(null);
  const [gameNow, setGameNow] = useState(() => Date.now());
  const [artworkSaved, setArtworkSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!canvas || !ctx || isTimeUp) return;
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

    channelRef.current?.send("undo_canvas");
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

    channelRef.current?.send("start_drawing");

    const actualColor = activeTool === "eraser" ? "#ffffff" : color;

    executeDot(pos.x, pos.y, actualColor, brushSize);

    channelRef.current?.send("draw_dot", {
      x: pos.x,
      y: pos.y,
      color: actualColor,
      size: brushSize,
    });

    setIsDrawing(true);
    prevPos.current = pos;
  };

  const flushStrokeBuffer = () => {
    if (strokeBufferRef.current.length === 0) return;

    channelRef.current?.send("draw_batch", {
      segments: strokeBufferRef.current,
    });

    strokeBufferRef.current = [];
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

    strokeBufferRef.current.push({
      x0: prevPos.current.x,
      y0: prevPos.current.y,
      x1: currentPos.x,
      y1: currentPos.y,
      color: actualColor,
      size: brushSize,
    });

    prevPos.current = currentPos;
  };

  const stopDrawing: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    flushStrokeBuffer();
    setIsDrawing(false);
    prevPos.current = null;
  };

  const fillCanvas = () => {
    pushHistory();

    executeFill(color);

    channelRef.current?.send("fill_canvas", { color });
  };

  const handleClose = () => {
    router.push("/feed");
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
    const intervalId = window.setInterval(() => {
      flushStrokeBuffer();
    }, STROKE_FLUSH_MS);
    return () => {
      window.clearInterval(intervalId);
      flushStrokeBuffer();
    };
  }, []);

  const saveArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    setSaveError(null);

    const base64 = canvas.toDataURL("image/png");
    finishGameAction(roomDatabaseId, roomId, base64)
      .then(() => setArtworkSaved(true))
      .catch((err) => {
        console.error("Error saving artwork:", err);
        setSaveError(
          "Couldn't save your artwork. Check your connection and try again.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  useEffect(() => {
    if (!isTimeUp || artworkSaved || isSaving || saveError) return;
    saveArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp, artworkSaved, roomDatabaseId, roomId]);

  useEffect(() => {
    const socket = new RoomSocket(
      process.env.NEXT_PUBLIC_REALTIME_WS_URL!,
      roomId,
      () => mintRealtimeToken(roomId),
    );

    const unsubscribers = [
      socket.on("draw_batch", (payload) => {
        const segments =
          (payload as { segments?: StrokeSegment[] } | undefined)
            ?.segments ?? [];
        for (const segment of segments) {
          executeStroke(
            segment.x0,
            segment.y0,
            segment.x1,
            segment.y1,
            segment.color,
            segment.size,
          );
        }
      }),
      socket.on("draw_dot", (payload) => {
        const dot = payload as {
          x: number;
          y: number;
          color: string;
          size: number;
        };
        executeDot(dot.x, dot.y, dot.color, dot.size);
      }),
      socket.on("fill_canvas", (payload) => {
        const fill = payload as { color: string };
        executeFill(fill.color);
      }),
      socket.on("undo_canvas", () => {
        executeUndo();
      }),
      socket.on("start_drawing", () => {
        pushHistory();
      }),
    ];

    void socket.connect();
    channelRef.current = socket;

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      socket.close();
    };
  }, [roomId]);

  return (
    <div className="flex flex-col px-4 sm:px-5 mt-20">
      <motion.div
        className="transitionBlock pointer-events-none origin-right"
        animate={{ scaleX: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      />
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
          onClose={handleClose}
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

        {saveError && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <Text className="text-pink! text-3xl text-center">{saveError}</Text>
            <button
              type="button"
              onClick={saveArtwork}
              disabled={isSaving}
              className="box-shadow cursor-pointer bg-pink px-10 py-4 text-25 text-white uppercase transition-transform hover:scale-105 active:scale-90 disabled:opacity-70"
            >
              {isSaving ? "Retrying..." : "Retry save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
