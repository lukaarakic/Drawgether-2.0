import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import generateRandomRotation from "~/utils/generate-random-rotation"
import CloseSVG from "~/assets/misc/close.svg"
import { FC, ReactNode, useEffect, useState } from "react"

interface ModalProps {
  children: ReactNode
  className?: string
  boxClassName?: string
  closeTo?: string
}

const Modal: FC<ModalProps> = ({
  children,
  className,
  boxClassName,
  closeTo,
}) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)

    return () => setLoaded(false)
  }, [])

  if (!loaded) return

  return createPortal(
    <div>
      <div className="pointer-events-none fixed left-0 top-0 z-40 h-screen w-screen cursor-default bg-black bg-opacity-50">
        &nbsp;
      </div>
      <div
        className={`box-shadow fixed left-1/2 top-1/2 z-50 h-[64rem] w-[55rem] -translate-x-1/2 -translate-y-1/2 transform bg-white ${boxClassName}`}
        style={{
          rotate: `${generateRandomRotation(new Date().getHours() % 12)}deg`,
        }}
      >
        <Link
          className="fixed right-5 top-5 h-8 w-8"
          to={closeTo ? closeTo : ".."}
          preventScrollReset
          relative="route"
        >
          <img src={CloseSVG} alt="" className="h-full w-full" />
        </Link>

        <div className={className}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
export default Modal
