import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kernel Panic — The Board Game",
  description:
    "The system is compromised. Only you can restore order. A strategic card game from Red Pup Games.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
