"use client";

import Image from "next/image";

interface Props {
  onStart: () => void;
  loading: boolean;
}

export function StartScreen({ onStart, loading }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-950">
      <Image
        src="/logo-dark.svg"
        alt="hae02y"
        width={80}
        height={55}
        className="mb-8 opacity-40"
      />
      <h1 className="text-3xl font-light tracking-[0.2em] text-white/90 mb-2">
        VIDEO ROULETTE
      </h1>
      <p className="text-sm text-zinc-500 mb-10">
        랜덤 상대와 화상 통화
      </p>
      <button
        onClick={onStart}
        disabled={loading}
        className="px-8 py-3 rounded-full bg-emerald-600 text-white text-sm tracking-wider hover:bg-emerald-700 disabled:opacity-50 transition-all"
      >
        {loading ? "연결 중..." : "시작하기"}
      </button>
      <p className="text-[10px] text-zinc-600 mt-4">
        카메라와 마이크 접근 권한이 필요합니다
      </p>
    </div>
  );
}
