import generateRandomRotation from "@/app/utils/generate-random-rotation";
import Image from "next/image";

const SmallArtwork = ({ art, index }: { art: string; index: number }) => {
  const rotations = [-1.02, 0.78, -1.21, 1.08, -0.93, 1.24];

  return (
    <div
      className="box-shadow h-92 w-92 cursor-pointer overflow-hidden bg-white bg-opacity-30"
      style={{
        rotate: `${generateRandomRotation(index % 6, rotations)}deg`,
      }}
    >
      <Image
        src={art}
        alt=""
        width={360}
        height={360}
        className="h-full w-full object-fill object-center"
      />
    </div>
  );
};

export default SmallArtwork;
