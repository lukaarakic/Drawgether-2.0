import { FC, ReactNode } from "react"

interface BoxLabelProps {
  className?: string
  children: ReactNode
  degree?: number
  blue?: boolean
}

const BoxLabel: FC<BoxLabelProps> = ({
  blue,
  children,
  degree = 0,
  className,
}) => {
  return (
    <div
      className={`drop-shadow-filter-lg bg-black p-2 ${className}`}
      style={{
        rotate: `${degree}deg`,
      }}
    >
      <div className={`${blue ? "bg-blue" : "bg-pink"} px-2 text-white`}>
        {children}
      </div>
    </div>
  )
}

export default BoxLabel
