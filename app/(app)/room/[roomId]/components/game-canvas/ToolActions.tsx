import Text from "@/app/components/Text";
import BoxButton from "@/app/components/ui/BoxButton";
import generateRandomRotation from "@/app/utils/generate-random-rotation";

interface ToolActionsProps {
  activeTool: "pencil" | "eraser";
  onSelectPencil: () => void;
  onSelectEraser: () => void;
  onFill: () => void;
}

const ToolActions = ({
  activeTool,
  onSelectPencil,
  onSelectEraser,
  onFill,
}: ToolActionsProps) => {
  return (
    <>
      <BoxButton
        className={`px-15 py-5 mb-6 ${activeTool === "pencil" ? "bg-blue!" : ""}`}
        degree={generateRandomRotation(1)}
        onClick={onSelectPencil}
      >
        <Text className="text-6xl" largeShadow>
          Pencil
        </Text>
      </BoxButton>
      <BoxButton
        className={`px-15 py-5 mb-6 ${activeTool === "eraser" ? "bg-blue!" : ""}`}
        degree={generateRandomRotation(2)}
        onClick={onSelectEraser}
      >
        <Text className="text-6xl" largeShadow>
          Eraser
        </Text>
      </BoxButton>
      <BoxButton
        className="px-15 py-5 mb-6"
        degree={generateRandomRotation(7)}
        onClick={onFill}
      >
        <Text className="text-6xl" largeShadow>
          Fill
        </Text>
      </BoxButton>
    </>
  );
};

export default ToolActions;
