"use client";

import { useRef, useEffect, useState } from "react";
import type { ConnectionState } from "@/hooks/usePeer";

interface Props {
  state: ConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  nickname: string;
  remoteNickname: string | null;
  onNext: () => void;
  onStop: () => void;
}

export function VideoChat({ state, localStream, remoteStream, callDuration, nickname, remoteNickname, onNext, onStop }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicOn(prev => !prev);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOn(prev => !prev);
    }
  };

  const min = Math.floor(callDuration / 60);
  const sec = callDuration % 60;
  const isLive = state === "connected" && remoteStream;

  return (
    <div className="h-full flex flex-col relative bg-zinc-950">
      {/* Remote video area */}
      <div className="flex-1 relative overflow-hidden">
        {isLive ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Waiting / Matching states */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950">
            {state === "waiting" && (
              <>
                {/* Ripple animation */}
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-emerald-500/15 animate-ping" style={{ animationDelay: "0.5s" }} />
                  <div className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-3xl">&#x1F50D;</span>
                  </div>
                </div>
                <p className="text-white/80 text-base font-medium mb-1">상대를 찾고 있습니다</p>
                <p className="text-zinc-600 text-xs">잠시만 기다려주세요...</p>
              </>
            )}
            {state === "matched" && (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6">
                  <span className="text-3xl animate-bounce">&#x1F91D;</span>
                </div>
                <p className="text-white/80 text-base font-medium mb-1">매칭 완료!</p>
                <p className="text-zinc-600 text-xs">연결 중...</p>
              </>
            )}
            {state === "idle" && (
              <p className="text-zinc-600 text-sm">대기 중</p>
            )}
          </div>
        )}

        {/* Top overlay bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          {/* Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
            <div className={`w-2 h-2 rounded-full ${
              isLive ? "bg-emerald-400 shadow-sm shadow-emerald-400" :
              state === "waiting" ? "bg-amber-400 animate-pulse" :
              state === "matched" ? "bg-blue-400 animate-pulse" :
              "bg-zinc-600"
            }`} />
            <span className="text-[11px] text-zinc-300 font-medium uppercase tracking-wider">
              {isLive ? "LIVE" :
               state === "waiting" ? "SEARCHING" :
               state === "matched" ? "CONNECTING" : "IDLE"}
            </span>
          </div>

          {/* Remote nickname + timer */}
          {isLive && (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
              <span className="text-sm text-white font-medium">{remoteNickname || "???"}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{min}:{sec.toString().padStart(2, "0")}</span>
            </div>
          )}
        </div>

        {/* Local video (PIP) */}
        <div className="absolute bottom-4 right-4 group">
          <div className="w-40 rounded-2xl overflow-hidden border-2 border-zinc-700/50 shadow-2xl bg-zinc-900 transition-transform group-hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-28 object-cover scale-x-[-1]"
            />
            <div className="px-3 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-400 truncate flex-1">{nickname}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="flex-shrink-0 px-6 py-5 bg-zinc-950 border-t border-zinc-800/50">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
              micOn
                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {micOn ? "\uD83C\uDF99" : "\uD83D\uDD07"}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCam}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
              camOn
                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {camOn ? "\uD83D\uDCF7" : "\uD83D\uDEAB"}
          </button>

          {/* Next person */}
          <button
            onClick={onNext}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-600/20"
            title="다음 사람"
          >
            &#x23ED;
          </button>

          {/* End call */}
          <button
            onClick={onStop}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center text-xl hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-600/20"
            title="종료"
          >
            &#x260E;
          </button>
        </div>
      </div>
    </div>
  );
}
