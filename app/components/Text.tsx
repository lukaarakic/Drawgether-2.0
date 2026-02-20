import { ReactNode } from "react"

interface TextProps {
  children: ReactNode
  className?: string
  largeShadow?: boolean
}

const Text = ({ children, className, largeShadow }: TextProps) => {
  return (
    <p
      className={`text-border text-white ${largeShadow ? "text-border-lg" : ""} ${className}`}
      data-text={children}
    >
      {children}
    </p>
  )
}
export default Text
