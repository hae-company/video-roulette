"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type Peer from "peerjs";
import type { MediaConnection } from "peerjs";

export type ConnectionState = "idle" | "connecting" | "waiting" | "matched" | "connected";

export function usePeer() {
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ConnectionState>("idle");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callStartRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize PeerJS + get local media
  const init = useCallback(async () => {
    setState("connecting");

    // Get camera + mic
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;

    // Create PeerJS instance
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

      // Handle incoming calls
      peer.on("call", (call) => {
        call.answer(localStreamRef.current!);
        callRef.current = call;

        call.on("stream", (remote) => {
          setRemoteStream(remote);
          setState("connected");
          startDurationTimer();
        });

        call.on("close", () => {
          handleDisconnect();
        });
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
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
    callStartRef.current = null;
    setCallDuration(0);
  }, []);

  // Start matching — poll the match API
  const findMatch = useCallback(async () => {
    if (!peerRef.current || !peerId) return;

    setState("waiting");

    // Poll every 2 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peerId }),
        });
        const data = await res.json();

        if (data.matched && data.remotePeerId) {
          stopPolling();
          setState("matched");

          // Call the matched peer
          const call = peerRef.current!.call(data.remotePeerId, localStreamRef.current!);
          callRef.current = call;

          call.on("stream", (remote) => {
            setRemoteStream(remote);
            setState("connected");
            startDurationTimer();
          });

          call.on("close", () => {
            handleDisconnect();
          });
        }
      } catch (err) {
        console.error("Match poll error:", err);
      }
    }, 2000);
  }, [peerId, startDurationTimer]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    setRemoteStream(null);
    stopDurationTimer();
    setState("idle");
  }, [stopDurationTimer]);

  // Skip to next person
  const next = useCallback(async () => {
    handleDisconnect();
    // Small delay then find new match
    setTimeout(() => findMatch(), 500);
  }, [handleDisconnect, findMatch]);

  // Leave queue on cleanup
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
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setState("idle");
  }, [peerId, stopPolling, handleDisconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    state,
    peerId,
    localStream: localStreamRef.current,
    remoteStream,
    callDuration,
    init,
    findMatch,
    next,
    stop,
  };
}
