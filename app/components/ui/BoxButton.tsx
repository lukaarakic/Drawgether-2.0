import { FC, ReactNode } from "react"

interface BoxButtonProps {
  children: ReactNode
  type?: "submit" | "reset" | "button" | undefined
  degree?: number
  className?: string
  disabled?: boolean
  onClick?: () => void
}

const BoxButton: FC<BoxButtonProps> = ({
  children,
  type = undefined,
  degree = 0,
  className,
  disabled,
  onClick,
}) => {
  return (
    <button
      className={`${className} box-shadow inline-block transform bg-pink font-zyzolOutline text-white transition-transform hover:scale-105 active:scale-90`}
      type={type}
      disabled={disabled}
      style={{
        rotate: `${degree}deg`,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default BoxButton
