import Hearts from "@/app/assets/misc/hearts.svg";
import Stars from "@/app/assets/misc/stars.svg";
import Marks from "@/app/assets/misc/marks.svg";

export const rules = [
  {
    type: Hearts,
    rule: "Keep it family friendly!",
    style: {
      top: 0,
      left: "-67rem",
      rotate: "5.75deg",
      animationDelay: "0s",
    },
  },
  {
    type: Stars,
    rule: "Stay positive!",
    style: {
      top: "10rem",
      left: "-15rem",
      rotate: "-4.56deg",
      animationDelay: ".5s",
    },
  },
  {
    type: Marks,
    rule: "BE CREATIVE!",
    style: {
      top: 0,
      right: "-69rem",
      animationDelay: "1s",
    },
  },
];

export const howTo = [
  {
    text: "Go to play tab",
    style: {
      rotate: "-6.26deg",
      animationDelay: "0s",
    },
  },
  {
    text: "Press DRAW",
    style: {
      rotate: "5.45deg",
      animationDelay: ".5s",
    },
  },
  {
    text: "Get the theme",
    style: {
      rotate: "-13.54deg",
      animationDelay: "1s",
    },
  },
  {
    text: "Start drawing!",
    style: {
      rotate: "8.29deg",
      animationDelay: "1.5s",
    },
  },
];
