import Link from "next/link";

const MobileError = () => {
  return (
    <div className="absolute left-1/2 top-[42%] w-[80%] -translate-x-1/2 -translate-y-1/2 transform">
      <p
        className="text-border text-40 text-white"
        data-text="Apologies! Currently, our platform works best on desktop"
      >
        <span className="text-pink">Apologies!</span> Currently, our platform
        works best on desktop
      </p>
      <p
        className="text-border text-40 text-white"
        data-text="Mobile
    optimization is in progress. Stay tuned for updates!"
      >
        Mobile optimization is in progress. Stay tuned for updates!
      </p>

      <Link
        href="/feed"
        className="text-border mt-20 text-29 text-pink"
        data-text="Back to home"
      >
        Back to home
      </Link>
    </div>
  );
};
export default MobileError;
