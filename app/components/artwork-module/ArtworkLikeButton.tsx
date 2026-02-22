"use client";

type ArtworkLikeButtonProps = {
  likesCount: number;
  isLiked: boolean;
  onLike?: () => void;
};

const ArtworkLikeButton = ({ likesCount, isLiked }: ArtworkLikeButtonProps) => {
  return (
    <button
      type="button"
      className="relative rotate-12"
      onClick={() => console.log("Like button clicked")}
    >
      <svg
        id="Layer_2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60.05 51.3"
        className="relative h-24 w-24"
      >
        <g id="Layer_1-2">
          <path
            fill="#212121"
            d="m55.65,7.14c-1.81-1.8-3.96-3.09-6.33-3.81C46.64,1.21,43.42.06,39.84.02c-4.1.05-7.91,1.62-10.77,4.43l-.61.62c-1.18-.76-2.44-1.35-3.75-1.75C21.97,1.19,18.76.04,15.28,0c-4.07-.05-8,1.52-10.73,4.27C1.59,7.11-.02,10.93,0,14.96c-.09,4.04,1.52,7.97,4.41,10.75l23.05,22.96,1.19-1.17,3.82,3.81,23.04-22.73c2.95-2.83,4.57-6.65,4.54-10.68.08-3.9-1.52-7.81-4.41-10.75h0Z"
          />
          <path
            fill={isLiked ? "#DE6B9B" : "#FFF"}
            d="m51.06,15.22c.06-2.88-1.13-5.73-3.24-7.89-2.16-2.15-4.85-3.26-7.97-3.3-3.01.04-5.86,1.21-7.96,3.27l-4.43,4.31-2.75-2.86-1.46-1.39c-2.23-2.16-4.99-3.31-8.02-3.35-1.2-.02-2.38.16-3.49.5-1.66.51-3.17,1.41-4.38,2.62-2.2,2.1-3.37,4.87-3.35,7.86-.07,3.03,1.07,5.8,3.21,7.86l20.27,20.18,20.24-19.97c2.18-2.09,3.35-4.86,3.34-7.84h0Z"
          />
        </g>
      </svg>

      <p
        className={`absolute left-[46%] top-[46%] -translate-x-1/2 -translate-y-1/2 transform text-18 text-black`}
      >
        {likesCount}
      </p>
    </button>
  );
};

export default ArtworkLikeButton;
