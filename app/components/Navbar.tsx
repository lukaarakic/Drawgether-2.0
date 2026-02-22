"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoOnly from "@/app/assets/logos/logo_only.svg";

type NavbarProps = {
  username: string;
  isMobile?: boolean;
};

const Navbar = ({ username, isMobile = false }: NavbarProps) => {
  const pathname = usePathname();

  const [rotations] = useState(() => ({
    feed: Math.random() * 4.8 - 2.4,
    search: Math.random() * 4.8 - 2.4,
    profile: Math.random() * 4.8 - 2.4,
    play: Math.random() * 4.8 - 2.4,
  }));

  function play() {
    new Audio("/audio/bloop.wav").play();
  }

  const linkClass = (path: string) => {
    const isActive = pathname.startsWith(path);
    return `text-border md:text-border-lg uppercase text-white ${isActive ? "activeNavLink" : ""}`;
  };

  const linkStyle = (rotation: number) =>
    ({
      "--nav-rotation": `${rotation.toFixed(2)}deg`,
    }) as React.CSSProperties;

  if (pathname.includes("play/")) {
    return null;
  }

  return (
    <div>
      <div className="fixed left-0 top-0 z-30 hidden h-12 w-screen bg-white md:block"></div>
      <nav
        className="box-shadow fixed bottom-11 left-1/2 z-50 flex h-[11.3rem] w-[90%] -translate-x-1/2 items-center justify-between
       rounded-full bg-blue px-20 align-middle text-25 xs:px-44 xs:text-32 md:top-11 md:px-28 lg:w-588 lg:px-44 lg:text-40"
      >
        <Link
          data-text="HOME"
          href="/feed"
          className={linkClass("/feed")}
          style={linkStyle(rotations.feed)}
          onClick={play}
        >
          Home
        </Link>
        <Link
          data-text="SEARCH"
          href="/search"
          className={linkClass("/search")}
          style={linkStyle(rotations.search)}
          onClick={play}
        >
          Search
        </Link>

        <Link href="/feed" onClick={play} className="hidden md:block">
          <Image
            src={LogoOnly}
            alt="Logo of drawgether"
            className="h-[12.8rem] w-[17.6rem]"
          />
        </Link>
        <Link
          data-text="profile"
          href={`/artist/${username}`}
          className={linkClass(`/artist/${username}`)}
          style={linkStyle(rotations.profile)}
          onClick={play}
        >
          Profile
        </Link>
        {!isMobile && (
          <Link
            data-text="play"
            href="/play"
            className={linkClass("/play")}
            style={linkStyle(rotations.play)}
            onClick={play}
          >
            Play
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
