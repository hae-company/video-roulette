"use client";

import { useState, useCallback } from "react";
import { usePeer } from "@/hooks/usePeer";
import { StartScreen } from "@/components/start-screen";
import { VideoChat } from "@/components/video-chat";
import { Footer } from "@/components/footer";

export default function Home() {
  const { state, localStream, remoteStream, callDuration, init, findMatch, next, stop } = usePeer();
  const [started, setStarted] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const handleStart = useCallback(async () => {
    setInitLoading(true);
    try {
      await init();
      setStarted(true);
      // Auto-start matching
      setTimeout(() => findMatch(), 300);
    } catch (err) {
      console.error("Init error:", err);
      alert("카메라/마이크 접근이 거부되었습니다.");
    }
    setInitLoading(false);
  }, [init, findMatch]);

  const handleStop = useCallback(() => {
    stop();
    setStarted(false);
  }, [stop]);

  return (
    <div className="h-full">
      {!started ? (
        <StartScreen onStart={handleStart} loading={initLoading} />
      ) : (
        <VideoChat
          state={state}
          localStream={localStream}
          remoteStream={remoteStream}
          callDuration={callDuration}
          onNext={next}
          onStop={handleStop}
        />
      )}
      <Footer />
    </div>
  );
}
