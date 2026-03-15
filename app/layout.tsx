import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Drawgether",
    template: "%s | Drawgether",
  },
  description: "A multiplayer drawing game where creativity meets AI.",
  openGraph: {
    type: "website",
    title: "Drawgether",
    description: "A multiplayer drawing game where creativity meets AI.",
    siteName: "Drawgether",
  },
  twitter: {
    card: "summary",
    title: "Drawgether",
    description: "A multiplayer drawing game where creativity meets AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
