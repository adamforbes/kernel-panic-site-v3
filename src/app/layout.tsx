import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Kernel Panic — A Real-Time Board Game",
  description:
    "Chaotically concurrent computation. You are a team of digital processes, racing to complete as many tasks as you can in 10 minutes. A real-time puzzle with no turns — everyone plays continuously as the clock ticks down. Compute and collaborate to set a new high score every game!",
  openGraph: {
    title: "Kernel Panic — A Real-Time Board Game",
    description:
      "A real-time puzzle board game of chaotically concurrent computation. No turns — everyone plays continuously. Race to complete tasks in 10 minutes!",
    siteName: "Kernel Panic Game",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kernel Panic — A Real-Time Board Game",
    description:
      "A real-time puzzle board game of chaotically concurrent computation. No turns — everyone plays continuously. Race to complete tasks in 10 minutes!",
  },
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
