"use client";

import Image from "next/image";

interface Props {
  onStart: () => void;
  loading: boolean;
  nickname: string;
}

export function StartScreen({ onStart, loading, nickname }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Image
          src="/logo-dark.svg"
          alt="hae02y"
          width={60}
          height={41}
          className="mb-10 opacity-30"
        />

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl mb-8 shadow-lg shadow-emerald-500/20">
          &#x1F3B2;
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
          Video Roulette
        </h1>
        <p className="text-zinc-500 mb-2 text-sm">
          랜덤 상대와 1:1 화상 통화
        </p>

        {/* Nickname preview */}
        <div className="mb-10 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-500 mr-2">내 닉네임:</span>
          <span className="text-sm text-emerald-400 font-medium">{nickname}</span>
        </div>

        <button
          onClick={onStart}
          disabled={loading}
          className="group relative px-10 py-4 rounded-2xl bg-emerald-600 text-white text-sm font-medium tracking-wider hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              연결 중...
            </span>
          ) : (
            "시작하기"
          )}
        </button>

        <p className="text-[10px] text-zinc-700 mt-6">
          카메라와 마이크 접근 권한이 필요합니다
        </p>
      </div>
    </div>
  );
}
