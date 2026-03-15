"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import BlueLogo from "@/app/assets/logos/blue_logo.svg";
import Text from "@/app/components/Text";
import Window from "@/app/components/tutorial/Window";
import BoxLabel from "@/app/components/ui/BoxLabel";
import { howTo, rules } from "./tutorial";

const Tutorial = () => {
  const headerRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLElement>(null);

  const isHeaderVisible = useInView(headerRef, { amount: 0.9 });

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end 15%"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  });
  const scaleY = useTransform(smoothProgress, [0, 1], [0, 1.4]);

  return (
    <div
      className={`${
        isHeaderVisible ? "bg-pink" : "bg-blue!"
      } pb-24 transition-colors duration-500 w-screen`}
    >
      <div className="relative mx-auto max-w-768">
        <header
          ref={headerRef}
          className="mx-auto flex h-svh w-max flex-col items-center justify-center"
        >
          <Link href="/feed">
            <Image
              src={BlueLogo}
              alt="Drawgether logo"
              className="absolute left-16 top-16 h-20 w-140"
            />
          </Link>

          <div>
            <h1
              className="text-border drop-shadow-filter-lg text-border-lg border-none text-center text-90 uppercase leading-none text-white"
              data-text="This is how you play"
            >
              This is how
              <br /> you play
            </h1>
            <BoxLabel blue degree={-3.29}>
              <p className="py-2 text-center font-zyzolOutline text-32 uppercase">
                and follow the rules:
              </p>
            </BoxLabel>
          </div>

          <div className="relative mt-40 h-140">
            {rules.map((rule, index) => (
              <Window
                key={`${index}-${rule.rule}`}
                index={index + 1}
                text={rule.rule}
                details={rule.type}
                style={rule.style}
                type="rule"
              />
            ))}
          </div>
        </header>

        <section ref={timelineRef} className="relative flex w-full">
          <div className="sticky top-72 flex w-1/2 flex-col items-center self-start leading-none">
            <Text largeShadow className="text-90 uppercase">
              so, this is
            </Text>
            <Text largeShadow className="text-90 uppercase">
              how you
            </Text>
            <Text
              largeShadow
              className={`text-165 uppercase transition-colors duration-500 ${
                isHeaderVisible ? "text-blue!" : "text-pink!"
              }`}
            >
              Play
            </Text>
          </div>

          <div className="box-shadow relative w-12 overflow-hidden rounded-full bg-white">
            <motion.div
              className="absolute inset-0 origin-top bg-pink"
              style={{ scaleY }}
            />
          </div>

          <div className="flex w-1/2 flex-col items-center gap-80">
            {howTo.map((item, index) => (
              <Window
                key={`${item.text}-${index}`}
                type="play"
                index={index + 1}
                text={item.text}
                style={item.style}
              />
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/feed"
            className="box-shadow text-border text-border-lg mb-40 mt-96 inline-block -rotate-3 bg-pink px-12 text-center font-zyzol text-40 uppercase text-white transition-transform hover:scale-90 active:scale-105"
            data-text="leave the tutorial"
          >
            leave the tutorial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
