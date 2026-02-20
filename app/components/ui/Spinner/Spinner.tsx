import "./spinner.css"

const Spinner = ({ className = "w-44 h-44" }: { className?: string }) => {
  return (
    <svg
      className={`pencil ${className}`}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="pencil-eraser">
          <rect rx="5" ry="5" width="30" height="30"></rect>
        </clipPath>
      </defs>
      <circle
        className="pencil__stroke"
        r="70"
        fill="none"
        stroke="#212121"
        strokeWidth="2"
        strokeDasharray="439.82 439.82"
        strokeDashoffset="439.82"
        strokeLinecap="round"
        transform="rotate(-113,100,100)"
      />
      <g className="pencil__rotate" transform="translate(100,100)">
        <g fill="none">
          <circle
            className="pencil__body1"
            r="64"
            stroke="#212121"
            strokeWidth="35"
            strokeDasharray="402.12 402.12"
            strokeDashoffset="402"
            transform="rotate(-90)"
          />
          <circle
            className="pencil__body1"
            r="64"
            stroke="#496EB5"
            strokeWidth="30"
            strokeDasharray="402.12 402.12"
            strokeDashoffset="402"
            transform="rotate(-90)"
          />
          <circle
            className="pencil__body1"
            r="64"
            stroke="#212121"
            strokeWidth="15"
            strokeDasharray="402.12 402.12"
            strokeDashoffset="402"
            transform="rotate(-90)"
          />
          <circle
            className="pencil__body1"
            r="64"
            stroke="#496EB5"
            strokeWidth="10"
            strokeDasharray="402.12 402.12"
            strokeDashoffset="402"
            transform="rotate(-90)"
          />
        </g>
        <g className="pencil__eraser" transform="rotate(-90) translate(49,0)">
          <g className="pencil__eraser-skew">
            <rect
              fill="#DE6B9B"
              strokeWidth="5"
              stroke="#212121"
              rx="5"
              ry="5"
              width="30"
              height="30"
            />
            <rect
              fill="#ffffff"
              strokeWidth="5"
              stroke="#212121"
              width="30"
              height="20"
            />
            <rect fill="#DE6B9B" rx="5" ry="5" width="30" height="30" />
            <rect fill="#ffffff" width="30" height="20" />
            <rect fill="#212121" y="6" width="30" height="2" />
            <rect fill="#212121" y="13" width="30" height="2" />
            <rect fill="#212121" y="20" width="30" height="2" />
          </g>
        </g>
        <g className="pencil__point" transform="rotate(-90) translate(49,-30)">
          <polygon
            fill="#212121"
            strokeWidth="5"
            stroke="#212121"
            points="15 3,28.6 28.1,1.4 28.1"
          />
          <polygon fill="#ffffff" points="15 3,28.6 28.1,1.4 28.1" />
          <polygon fill="#212121" points="15 0,20 10,10 10" />
        </g>
      </g>
    </svg>
  )
}
export default Spinner
