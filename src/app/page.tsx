"use client";

import { useState, useCallback } from "react";
import { usePeer } from "@/hooks/usePeer";
import { StartScreen } from "@/components/start-screen";
import { VideoChat } from "@/components/video-chat";
import { Footer } from "@/components/footer";

export default function Home() {
  const { state, error, localStream, remoteStream, callDuration, nickname, remoteNickname, init, findMatch, next, stop } = usePeer();
  const [started, setStarted] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const handleStart = useCallback(async () => {
    setInitLoading(true);
    try {
      await init();
      setStarted(true);
      // init() resolves after peer.on("open") — peerRef.current.id is now set
      // findMatch uses peerRef.current.id directly (not state), so safe to call immediately
      findMatch();
    } catch {
      // error is already set in usePeer
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
        <StartScreen onStart={handleStart} loading={initLoading} nickname={nickname} error={error} />
      ) : (
        <VideoChat
          state={state}
          error={error}
          localStream={localStream}
          remoteStream={remoteStream}
          callDuration={callDuration}
          nickname={nickname}
          remoteNickname={remoteNickname}
          onNext={next}
          onStop={handleStop}
        />
      )}
      <Footer />
    </div>
  );
}
