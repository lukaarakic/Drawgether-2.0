import Image from "next/image";

import PinkLogo from "@/app/assets/logos/pink_logo.svg";
import LeftCloud from "@/app/assets/clouds/left_white.svg";
import RightCloud from "@/app/assets/clouds/right_white.svg";
import Link from "next/link";

export default function Index() {
  return (
    <main className="grid h-svh place-items-center bg-blue">
      <div className="mx-auto mb-8 flex w-2xl items-center justify-center pt-8">
        <Image src={PinkLogo} alt="Drawgether logo" width={420} />
      </div>

      <div className=" flex w-full flex-col items-center justify-center">
        <h1
          className="text-border text-border-lg drop-shadow-filter mb-10 rotate-2 text-center text-75 leading-none tracking-tighter text-white md:text-90 lg:text-128"
          data-text="UNLEASH YOUR
        CREATIVE SIDE"
        >
          UNLEASH YOUR <br />
          CREATIVE SIDE
        </h1>

        <div className="box-shadow mb-24 -rotate-2 bg-pink px-4">
          <p className="font-zyzolOutline text-60 leading-tight text-white md:text-90">
            with your friends!
          </p>
        </div>

        <Link
          className="box-shadow flex h-58 w-58 items-center justify-center rounded-full bg-pink uppercase transition-transform hover:scale-105 active:scale-90"
          href={`login`}
        >
          <div className="rotate-10 text-32 text-white">Start</div>
        </Link>
      </div>

      <div>
        <Image
          src={LeftCloud}
          alt="Left corner cloud"
          className="pointer-events-none absolute bottom-0 left-0 w-full xs:w-1/2 lg:w-1/3"
        />
        <Image
          src={RightCloud}
          alt="Right corner cloud"
          className="pointer-events-none absolute bottom-0 right-0 w-full xs:w-1/2 lg:w-1/3"
        />
      </div>
    </main>
  );
}
