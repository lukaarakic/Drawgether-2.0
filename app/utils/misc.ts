import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function maskEmail(email: string): string {
  const [username, domain] = email.split("@");
  const maskedUsername =
    username.charAt(0) + "*".repeat(3) + username.charAt(username.length - 1);
  return maskedUsername + "@" + domain;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
