import { FC, ReactNode } from "react";

interface BoxLabelProps {
  className?: string;
  children: ReactNode;
  degree?: number;
  blue?: boolean;
  white?: boolean;
}

const BoxLabel: FC<BoxLabelProps> = ({
  blue,
  white,
  children,
  degree = 0,
  className,
}) => {
  const bgColor = blue ? "bg-blue" : white ? "bg-white" : "bg-pink";
  const textColor = white ? "text-black" : "text-white";

  return (
    <div
      className={`drop-shadow-filter-lg bg-black p-2 ${className}`}
      style={{
        rotate: `${degree}deg`,
      }}
    >
      <div className={`${bgColor} px-2 ${textColor}`}>{children}</div>
    </div>
  );
};

export default BoxLabel;
