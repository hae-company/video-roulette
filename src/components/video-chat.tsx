"use client";

import { useRef, useEffect, useState } from "react";
import type { ConnectionState } from "@/hooks/usePeer";

interface Props {
  state: ConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  onNext: () => void;
  onStop: () => void;
}

export function VideoChat({ state, localStream, remoteStream, callDuration, onNext, onStop }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
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

  return (
    <div className="h-full flex flex-col relative">
      {/* Remote video (full screen) */}
      <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
        {state === "connected" && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            {state === "waiting" && (
              <>
                <div className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm tracking-wider">상대를 찾고 있습니다...</p>
              </>
            )}
            {state === "matched" && (
              <>
                <div className="w-16 h-16 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm tracking-wider">연결 중...</p>
              </>
            )}
          </div>
        )}

        {/* Call duration */}
        {state === "connected" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-zinc-300">
            {min}:{sec.toString().padStart(2, "0")}
          </div>
        )}

        {/* Connection status indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            state === "connected" ? "bg-emerald-500" :
            state === "waiting" ? "bg-yellow-500 animate-pulse" :
            "bg-zinc-600"
          }`} />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {state === "connected" ? "LIVE" :
             state === "waiting" ? "SEARCHING" :
             state === "matched" ? "CONNECTING" : ""}
          </span>
        </div>
      </div>

      {/* Local video (PIP) */}
      <div className="absolute bottom-20 right-4 w-36 h-28 rounded-xl overflow-hidden border border-zinc-700 shadow-xl bg-zinc-800">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-zinc-950 border-t border-zinc-800">
        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
            micOn ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-red-600 text-white"
          }`}
          title={micOn ? "마이크 끄기" : "마이크 켜기"}
        >
          {micOn ? "\uD83C\uDF99" : "\uD83D\uDD07"}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
            camOn ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-red-600 text-white"
          }`}
          title={camOn ? "카메라 끄기" : "카메라 켜기"}
        >
          {camOn ? "\uD83D\uDCF7" : "\uD83D\uDEAB"}
        </button>

        {/* Next */}
        {state === "connected" && (
          <button
            onClick={onNext}
            className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg hover:bg-blue-700 transition-colors"
            title="다음 사람"
          >
            &#x23ED;
          </button>
        )}

        {/* End */}
        <button
          onClick={onStop}
          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-lg hover:bg-red-700 transition-colors"
          title="종료"
        >
          &#x260E;
        </button>
      </div>
    </div>
  );
}
