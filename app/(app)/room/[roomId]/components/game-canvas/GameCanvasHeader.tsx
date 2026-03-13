import BoxLabel from "@/app/components/ui/BoxLabel";
import Text from "@/app/components/Text";

interface GameCanvasHeaderProps {
  theme: string | null;
}

export default function GameCanvasHeader({ theme }: GameCanvasHeaderProps) {
  return (
    <BoxLabel className="w-fit text-6xl mx-auto" degree={1.2}>
      <Text className="px-8 py-4" largeShadow>
        {theme ?? "Get ready to draw."}
      </Text>
    </BoxLabel>
  );
}
