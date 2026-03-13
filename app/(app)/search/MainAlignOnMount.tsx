"use client";

import { useEffect } from "react";

export default function MainAlignOnMount() {
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    mainEl.classList.remove("items-center");
    mainEl.classList.add("items-start");

    return () => {
      mainEl.classList.remove("items-start");
      mainEl.classList.add("items-center");
    };
  }, []);

  return null;
}
