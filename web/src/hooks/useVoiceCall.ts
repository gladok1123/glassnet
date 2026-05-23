"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiUrl, voiceApi } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { useRestSignaling } from "@/lib/signaling";

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type Peer = {
  userId: string;
  pc: RTCPeerConnection;
  stream: MediaStream | null;
};

type SignalPayload = {
  type: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export function useVoiceCall(roomId: string, myUserId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Map<string, MediaStream>
  >(new Map());
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalSinceRef = useRef<string>(new Date(0).toISOString());
  const restSignaling = useRestSignaling();

  const sendSignal = useCallback(
    (toUserId: string, signal: SignalPayload) => {
      if (restSignaling) {
        void voiceApi.sendSignal({ roomId, toUserId, signal });
        return;
      }
      socketRef.current?.emit("voice:signal", {
        roomId,
        toUserId,
        signal,
      });
    },
    [restSignaling, roomId]
  );

  const updateRemotes = useCallback(() => {
    const map = new Map<string, MediaStream>();
    peersRef.current.forEach((p, uid) => {
      if (p.stream) map.set(uid, p.stream);
    });
    setRemoteStreams(new Map(map));
  }, []);

  const replaceOutgoingTrack = useCallback(
    async (track: MediaStreamTrack | null, kind: "audio" | "video") => {
      for (const { pc } of peersRef.current.values()) {
        const sender = pc
          .getSenders()
          .find((s) => s.track?.kind === kind || (!s.track && kind === "audio"));
        if (sender) await sender.replaceTrack(track);
        else if (track) pc.addTrack(track, localStreamRef.current!);
      }
    },
    []
  );

  const createPeer = useCallback(
    async (remoteUserId: string, initiator: boolean) => {
      if (peersRef.current.has(remoteUserId) || remoteUserId === myUserId)
        return;
      const pc = new RTCPeerConnection(ICE);
      const peer: Peer = { userId: remoteUserId, pc, stream: null };
      peersRef.current.set(remoteUserId, peer);

      localStreamRef.current
        ?.getTracks()
        .forEach((t) => pc.addTrack(t, localStreamRef.current!));

      pc.ontrack = (ev) => {
        peer.stream = ev.streams[0] ?? null;
        updateRemotes();
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        sendSignal(remoteUserId, { type: "ice", candidate: ev.candidate });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") pc.restartIce();
      };

      if (initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(remoteUserId, { type: "offer", sdp: offer });
      }
    },
    [myUserId, sendSignal, updateRemotes]
  );

  const handleSignal = useCallback(
    async (fromUserId: string, signal: SignalPayload) => {
      let peer = peersRef.current.get(fromUserId);
      if (!peer) {
        await createPeer(fromUserId, false);
        peer = peersRef.current.get(fromUserId);
      }
      if (!peer) return;
      const { pc } = peer;
      if (signal.type === "offer" && signal.sdp) {
        await pc.setRemoteDescription(signal.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(fromUserId, { type: "answer", sdp: answer });
      } else if (signal.type === "answer" && signal.sdp) {
        await pc.setRemoteDescription(signal.sdp);
      } else if (signal.type === "ice" && signal.candidate) {
        await pc.addIceCandidate(signal.candidate);
      }
    },
    [createPeer, sendSignal]
  );

  const syncRoomMembers = useCallback(async () => {
    const { room } = await voiceApi.get(roomId);
    const memberIds = (room.members ?? []).map((m) => m.user.id);
    for (const uid of memberIds) {
      if (uid === myUserId || peersRef.current.has(uid)) continue;
      await createPeer(uid, myUserId < uid);
    }
    for (const uid of [...peersRef.current.keys()]) {
      if (!memberIds.includes(uid)) {
        peersRef.current.get(uid)?.pc.close();
        peersRef.current.delete(uid);
      }
    }
    updateRemotes();
  }, [createPeer, myUserId, roomId, updateRemotes]);

  const startRestPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const { signals } = await voiceApi.pollSignals(signalSinceRef.current);
          for (const s of signals) {
            if (s.roomId !== roomId) continue;
            signalSinceRef.current = s.at;
            if (s.fromUserId === myUserId) continue;
            await handleSignal(s.fromUserId, s.signal);
          }
          await syncRoomMembers();
        } catch {
          /* ignore transient poll errors */
        }
      })();
    }, 800);
  }, [handleSignal, myUserId, roomId, syncRoomMembers]);

  const stopRestPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const join = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch {
      setError("Нет доступа к микрофону");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    if (restSignaling) {
      try {
        await voiceApi.join(roomId);
        signalSinceRef.current = new Date().toISOString();
        setConnected(true);
        await syncRoomMembers();
        startRestPolling();
      } catch {
        setError("Не удалось подключиться к комнате");
      }
      return;
    }

    const socket = io(getApiUrl(), { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("voice:join", roomId);
      setConnected(true);
    });

    socket.on("voice:peer-joined", ({ userId }: { userId: string }) => {
      if (userId !== myUserId) void createPeer(userId, true);
    });

    socket.on("voice:peer-left", ({ userId }: { userId: string }) => {
      const p = peersRef.current.get(userId);
      p?.pc.close();
      peersRef.current.delete(userId);
      updateRemotes();
    });

    socket.on(
      "voice:signal",
      (payload: { fromUserId: string; signal: SignalPayload }) => {
        if (payload.fromUserId === myUserId) return;
        void handleSignal(payload.fromUserId, payload.signal);
      }
    );
  }, [
    createPeer,
    handleSignal,
    myUserId,
    restSignaling,
    roomId,
    startRestPolling,
    syncRoomMembers,
    updateRemotes,
  ]);

  const leave = useCallback(() => {
    stopRestPolling();
    if (restSignaling) {
      void voiceApi.leave(roomId);
    } else {
      socketRef.current?.emit("voice:leave", roomId);
      socketRef.current?.disconnect();
    }
    peersRef.current.forEach((p) => p.pc.close());
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenTrackRef.current?.stop();
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setConnected(false);
    setScreenSharing(false);
  }, [restSignaling, roomId, stopRestPolling]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  }, []);

  const toggleDeafen = useCallback(() => {
    setDeafened((d) => {
      const next = !d;
      document.querySelectorAll("audio[data-voice-remote]").forEach((el) => {
        (el as HTMLAudioElement).muted = next;
      });
      return next;
    });
  }, []);

  const toggleScreen = useCallback(async () => {
    if (screenSharing) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const mic = localStreamRef.current?.getAudioTracks()[0] ?? null;
      await replaceOutgoingTrack(mic, "video");
      const videoSenders = peersRef.current.values();
      for (const { pc } of videoSenders) {
        pc.getSenders()
          .filter((s) => s.track?.kind === "video")
          .forEach((s) => void s.replaceTrack(null));
      }
      setScreenSharing(false);
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const track = display.getVideoTracks()[0];
      screenTrackRef.current = track;
      track.onended = () => void toggleScreen();
      for (const { pc } of peersRef.current.values()) {
        let sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (!sender) sender = pc.addTrack(track, display);
        else await sender.replaceTrack(track);
      }
      setScreenSharing(true);
    } catch {
      setError("Демонстрация экрана отменена");
    }
  }, [replaceOutgoingTrack, screenSharing]);

  useEffect(() => () => leave(), [leave]);

  return {
    localStream,
    remoteStreams,
    muted,
    deafened,
    screenSharing,
    connected,
    error,
    join,
    leave,
    toggleMute,
    toggleDeafen,
    toggleScreen,
  };
}
