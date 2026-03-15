import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to continue drawing with friends.",
};

export default async function Login() {
  return (
    <div className="flex flex-col">
      <LoginForm />

      <div className="flex flex-col text-center text-25 text-white">
        <p
          data-text="Don’t have an account?"
          className="text-border text-border-sm"
        >
          Don’t have an account?{" "}
          <Link
            href={"/register"}
            className="text-border text-border-sm text-pink underline"
            data-text="Register."
          >
            Register.
          </Link>
        </p>
        <p
          data-text="Forgot your password?"
          className="text-border text-border-sm"
        >
          Forgot your password?{" "}
          <Link
            href={"/forgot-password"}
            className="text-border text-border-sm text-pink underline"
            data-text="Reset it."
          >
            Reset it.
          </Link>
        </p>
      </div>
    </div>
  );
}
