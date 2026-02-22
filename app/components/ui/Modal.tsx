"use client";

import { useRouter } from "next/navigation";
import generateRandomRotation from "@/app/utils/generate-random-rotation";
import CloseSVG from "@/app/assets/misc/close.svg";
import { FC, ReactNode, useCallback } from "react";
import Image from "next/image";

interface ModalProps {
  children: ReactNode;
  className?: string;
  boxClassName?: string;
  closeTo?: string;
}

const Modal: FC<ModalProps> = ({ children, className, boxClassName }) => {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 cursor-pointer bg-black/50"
      />
      <div
        className={`box-shadow fixed left-1/2 p-20 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transform bg-white ${boxClassName}`}
        style={{
          rotate: `${generateRandomRotation(1)}deg`,
        }}
      >
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 h-8 w-8 cursor-pointer"
          type="button"
        >
          <Image
            src={CloseSVG}
            alt="Close"
            width={20}
            height={20}
            className="h-full w-full"
          />
        </button>

        <div className={className}>{children}</div>
      </div>
    </>
  );
};
export default Modal;
