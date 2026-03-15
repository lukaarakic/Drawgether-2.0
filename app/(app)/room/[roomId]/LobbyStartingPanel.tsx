import Image from "next/image";
import FullLogo from "@/app/assets/logos/full_both_logo.svg";
import Bubble from "@/app/assets/misc/chat_bubble.svg";
import GPTLogo from "@/app/assets/logos/gpt_logo.svg";
import { motion } from "framer-motion";

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
  const isFinished = safeCountdownSeconds <= 1;

  return (
    <>
      <motion.div
        className="transitionBlock pointer-events-none origin-top"
        animate={{ scaleY: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      />

      <motion.div
        className="transitionBlock pointer-events-none origin-left"
        initial={false}
        animate={{ scaleX: isFinished ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      />

      <div className="flex flex-col lg:flex-row mt-40 md:mt-80 lg:mt-60">
        <div>
          <Image
            src={FullLogo}
            alt=""
            className="h-104 w-180 lg:h-204 lg:w-280"
          />
        </div>

        <div className="flex h-192 w-3xl mx-auto lg:mx-auto p-10 box-shadow bg-white lg:border-0 lg:bg-transparent lg:filter-none">
          <Image
            src={Bubble}
            alt=""
            className="absolute -z-10 h-192 w-3xl hidden lg:block"
          />
          <div className="lg:ml-36 lg:mr-20 mt-8 flex h-full flex-col justify-between pb-16 text-34 leading-none">
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
