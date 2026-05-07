"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type Peer from "peerjs";
import type { MediaConnection } from "peerjs";
import { generateNickname } from "@/lib/nicknames";

export type ConnectionState = "idle" | "connecting" | "camera-error" | "waiting" | "matched" | "connected";

export function usePeer() {
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("...");

  // Generate nickname on client only to avoid hydration mismatch
  useEffect(() => {
    setNickname(generateNickname());
  }, []);
  const [remoteNickname, setRemoteNickname] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callStartRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const init = useCallback(async () => {
    setState("connecting");
    setError(null);

    // 1. Get camera
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.error("Camera error:", err);
      setState("camera-error");
      setError("카메라/마이크 접근이 거부되었습니다. 브라우저 설정을 확인해주세요.");
      throw err;
    }
    localStreamRef.current = stream;

    // 2. Create PeerJS
    const { default: PeerJS } = await import("peerjs");

    return new Promise<void>((resolve, reject) => {
      const peer = new PeerJS({
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });

      // Timeout: if PeerJS doesn't connect in 10 seconds
      const timeout = setTimeout(() => {
        setError("PeerJS 서버 연결 실패. 네트워크를 확인해주세요.");
        setState("idle");
        peer.destroy();
        reject(new Error("PeerJS timeout"));
      }, 10000);

      peer.on("open", (id) => {
        clearTimeout(timeout);
        peerRef.current = peer;
        setPeerId(id);
        setState("idle");
        console.log("[Peer] Connected with ID:", id);
        resolve();
      });

      peer.on("call", (call) => {
        call.answer(localStreamRef.current!);
        callRef.current = call;

        call.on("stream", (remote) => {
          setRemoteStream(remote);
          setState("connected");
          startDurationTimer();
          // Try to get remote nickname
          fetchRemoteNickname(call.peer);
        });

        call.on("close", handleDisconnect);
      });

      peer.on("error", (err) => {
        clearTimeout(timeout);
        console.error("PeerJS error:", err);
        setError(`PeerJS 오류: ${err.type}`);
      });
    });
  }, []);

  const fetchRemoteNickname = useCallback(async (remotePeerId: string) => {
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: remotePeerId, action: "getNick" }),
      });
      const data = await res.json();
      if (data.nickname) setRemoteNickname(data.nickname);
    } catch { /* ignore */ }
  }, []);

  const startDurationTimer = useCallback(() => {
    callStartRef.current = Date.now();
    setCallDuration(0);
    durationRef.current = setInterval(() => {
      if (callStartRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationRef.current) clearInterval(durationRef.current);
    durationRef.current = null;
    callStartRef.current = null;
    setCallDuration(0);
  }, []);

  const handleDisconnect = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    setRemoteStream(null);
    setRemoteNickname(null);
    stopDurationTimer();
    setState("idle");
  }, [stopDurationTimer]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const findMatch = useCallback(async () => {
    if (!peerRef.current || !peerId) return;

    setState("waiting");
    setRemoteNickname(null);
    setError(null);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peerId, nickname }),
        });
        const data = await res.json();

        if (data.matched && data.remotePeerId) {
          stopPolling();
          setState("matched");
          setRemoteNickname(data.remoteNickname || null);

          const call = peerRef.current!.call(data.remotePeerId, localStreamRef.current!);
          callRef.current = call;

          call.on("stream", (remote) => {
            setRemoteStream(remote);
            setState("connected");
            startDurationTimer();
          });

          call.on("close", handleDisconnect);
        }
      } catch (err) {
        console.error("Match poll error:", err);
      }
    }, 2000);
  }, [peerId, nickname, stopPolling, startDurationTimer, handleDisconnect]);

  const next = useCallback(async () => {
    handleDisconnect();
    setTimeout(() => findMatch(), 500);
  }, [handleDisconnect, findMatch]);

  const stop = useCallback(async () => {
    stopPolling();
    handleDisconnect();
    if (peerId) {
      fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId, action: "leave" }),
      }).catch(() => {});
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setState("idle");
    setError(null);
  }, [peerId, stopPolling, handleDisconnect]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return {
    state, error, peerId, nickname, remoteNickname,
    localStream: localStreamRef.current, remoteStream,
    callDuration, init, findMatch, next, stop,
  };
}
