import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Video Roulette",
  description: "랜덤 화상 채팅 — 새로운 사람과 만나보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="h-full bg-zinc-950 text-white font-[family-name:var(--font-geist)] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
