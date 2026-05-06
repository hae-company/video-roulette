"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type Peer from "peerjs";
import type { MediaConnection } from "peerjs";
import { generateNickname } from "@/lib/nicknames";

export type ConnectionState = "idle" | "connecting" | "waiting" | "matched" | "connected";

export function usePeer() {
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ConnectionState>("idle");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [nickname] = useState(() => generateNickname());
  const [remoteNickname, setRemoteNickname] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callStartRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const init = useCallback(async () => {
    setState("connecting");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;

    const { default: PeerJS } = await import("peerjs");
    const peer = new PeerJS({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    return new Promise<void>((resolve) => {
      peer.on("open", (id) => {
        peerRef.current = peer;
        setPeerId(id);
        setState("idle");
        resolve();
      });

      peer.on("call", (call) => {
        call.answer(localStreamRef.current!);
        callRef.current = call;

        call.on("stream", (remote) => {
          setRemoteStream(remote);
          setState("connected");
          startDurationTimer();
        });

        call.on("close", handleDisconnect);
      });

      peer.on("error", (err) => {
        console.error("PeerJS error:", err);
      });
    });
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
  }, [peerId, stopPolling, handleDisconnect]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return {
    state, peerId, nickname, remoteNickname,
    localStream: localStreamRef.current, remoteStream,
    callDuration, init, findMatch, next, stop,
  };
}
