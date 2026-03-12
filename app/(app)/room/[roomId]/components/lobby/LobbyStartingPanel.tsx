import Text from "@/app/components/Text";

const LobbyStartingPanel = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-8 text-center">
      <Text className="text-60 uppercase leading-none text-blue!" largeShadow>
        Starting...
      </Text>
      <Text className="max-w-3xl text-4xl leading-tight">
        Preparing the next room step and fetching the drawing topic.
      </Text>
    </div>
  );
};

export default LobbyStartingPanel;
