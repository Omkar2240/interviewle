"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket";
import { createPeerConnection } from "../../lib/webrtc";

interface MatchedEvent {
  roomId: string;
  initiator: boolean;
}

interface SignalData {
  type: "offer" | "answer" | "ice";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export default function Home() {

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef("");

  const [roomId, setRoomId] = useState("");

  useEffect(() => {

    initMedia();

    socket.on("matched", handleMatched);
    socket.on("signal", handleSignal);

    return () => {
      socket.off("matched");
      socket.off("signal");
    };

  }, []);

  async function initMedia() {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    const pc = createPeerConnection(stream);

    pc.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          roomId: roomIdRef.current,
          data: {
            type: "ice",
            candidate: event.candidate
          }
        });
      }
    };

    pcRef.current = pc;
  }

  function findPartner() {
    socket.emit("join-queue");
  }

  async function handleMatched({ roomId, initiator }: MatchedEvent) {

    setRoomId(roomId);
    roomIdRef.current = roomId;

    const pc = pcRef.current;

    if (!pc) return;

    if (initiator) {

      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      socket.emit("signal", {
        roomId,
        data: {
          type: "offer",
          offer
        }
      });

    }
  }

  async function handleSignal(data: SignalData) {

    const pc = pcRef.current;

    if (!pc) return;

    if (data.type === "offer" && data.offer) {

      await pc.setRemoteDescription(data.offer);

      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);

      socket.emit("signal", {
        roomId: roomIdRef.current,
        data: {
          type: "answer",
          answer
        }
      });

    }

    if (data.type === "answer" && data.answer) {
      await pc.setRemoteDescription(data.answer);
    }

    if (data.type === "ice" && data.candidate) {
      await pc.addIceCandidate(data.candidate);
    }
  }

  return (

    <div style={{ padding: 20 }}>

      <h1>Interview Practice</h1>

      <button onClick={findPartner}>
        Find Partner
      </button>

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>

        <video
          ref={localVideo}
          autoPlay
          playsInline
          muted
          width={300}
        />

        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          width={300}
        />

      </div>

    </div>
  );
}