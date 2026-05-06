"use client";

import Image from "next/image";

export function Footer() {
  return (
    <a
      href="https://blog.hae02y.me"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-1 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 opacity-20 hover:opacity-50 transition-opacity"
    >
      <Image src="/logo-dark.svg" alt="hae02y" width={18} height={12} />
      <span className="text-[8px] text-zinc-500 tracking-widest">hae02y</span>
    </a>
  );
}
