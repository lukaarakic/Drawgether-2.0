import Image from "next/image";
import FullLogo from "@/app/assets/logos/full_both_logo.svg";
import Bubble from "@/app/assets/misc/chat_bubble.svg";
import GPTLogo from "@/app/assets/logos/gpt_logo.svg";

interface LobbyStartingPanelProps {
  introMessage: string | null;
  theme: string | null;
  countdownSeconds: number;
}

const LobbyStartingPanel = ({
  introMessage,
  theme,
  countdownSeconds,
}: LobbyStartingPanelProps) => {
  const safeCountdownSeconds = Math.max(0, countdownSeconds);

  return (
    <>
      <div className="transitionBlock origin-bottom scale-y-0" />

      <div className="flex mt-40">
        <div>
          <Image src={FullLogo} alt="" className="h-204 w-280" />
        </div>

        <div className="flex h-192 w-3xl">
          <Image src={Bubble} alt="" className="absolute -z-10 h-192 w-3xl" />
          <div className="ml-36 mr-20 mt-8 flex h-full flex-col justify-between pb-16 text-34 leading-none">
            <div>
              <p>
                Welcome to <span className="text-pink">Draw</span>
                <span className="text-blue">gether</span>!
              </p>
              <p className="mt-8">
                {introMessage ?? "Getting your next round ready."}
              </p>
              <p className="mt-10 text-blue">Your theme is:</p>
              <p className="mt-4 text-pink">
                {theme ?? "Surprise theme incoming..."}
              </p>
            </div>

            <div className="flex items-center">
              <Image src={GPTLogo} alt="" />
              <p className="ml-4 text-22 text-blue">Powered by: ChatGPT</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-44 flex flex-col items-center justify-center">
        <button
          disabled={safeCountdownSeconds <= 0}
          className="box-shadow flex h-44 w-44 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90"
        >
          <p
            className="text-border text-border-lg rotate-10 text-65 text-white"
            data-text={safeCountdownSeconds}
          >
            {safeCountdownSeconds}
          </p>
        </button>
        <p
          className="text-border text-border-lg text-25 text-blue"
          data-text="Timer"
        >
          Timer
        </p>
      </div>
    </>
  );
};

export default LobbyStartingPanel;
