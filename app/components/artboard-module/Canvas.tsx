interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  handleMouseDown: React.MouseEventHandler<HTMLCanvasElement>
  handleMouseMove: React.MouseEventHandler<HTMLCanvasElement>
  handleMouseUp: React.MouseEventHandler<HTMLCanvasElement>
  handleClick: React.MouseEventHandler<HTMLCanvasElement>
}

const Canvas = ({
  canvasRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleClick,
}: CanvasProps) => {
  return (
    <>
      <canvas
        width={512}
        height={512}
        className="box-shadow cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        ref={canvasRef}
      />
    </>
  )
}
export default Canvas
