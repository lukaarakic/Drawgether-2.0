import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

// Assets
import FullPinkLogo from "@/app/assets/logos/full_pink_logo.svg";
import LeftCloud from "@/app/assets/clouds/left_white.svg";
import RightCloud from "@/app/assets/clouds/right_white.svg";

export const metadata: Metadata = {
  title: "Drawgether",
  description: "Welcome to Remix!",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-svh place-items-center bg-blue">
      <header className="flex items-center justify-center pt-8">
        <Link href="/">
          <Image
            src={FullPinkLogo}
            alt="Drawgether logo"
            className="h-[21.6rem] w-118"
          />
        </Link>
      </header>

      <main className="grid place-items-center gap-6">{children}</main>

      <div>
        <Image
          src={LeftCloud}
          alt="Left corner cloud"
          className="pointer-events-none absolute bottom-0 left-0 w-1/3"
        />
        <Image
          src={RightCloud}
          alt="Right corner cloud"
          className="pointer-events-none absolute bottom-0 right-0 w-1/3"
        />
      </div>
    </div>
  );
}
