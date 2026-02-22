import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-blue">
      <div className="flex flex-col">
        <h1
          className="text-border text-white text-9xl"
          data-text="We can not find this page"
        >
          We can not find this page
        </h1>
      </div>
      <Link
        href="/feed"
        className="text-border mt-8 text-7xl text-pink underline"
        data-text="Back to home"
      >
        Back to home
      </Link>
    </div>
  );
}
