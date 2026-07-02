import { useRef, useCallback, useEffect } from 'react';
import { getSocket } from '../../../socket/socket';
import { useCallStore } from '../../../store/useCallStore';
import type { CallType } from '../../../store/useCallStore';
import axiosInstance from '../../../services/axiosInstance';

// ——— ICE Server Config ———
// STUN: Google STUN (luôn miễn phí, dùng để khám phá IP Public)
// TURN: Lấy từ backend API. Cache lại để tránh gọi nhiều lần.
let cachedIceServers: RTCIceServer[] | null = null;

const getIceServersAsync = async (): Promise<RTCIceServer[]> => {
  if (cachedIceServers) return cachedIceServers;

  const servers: RTCIceServer[] = [
    // Google STUN
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  try {
    const res = await axiosInstance.get('/chat/turn');
    const { url, username, credential, iceServers } = res.data.data;

    if (iceServers && Array.isArray(iceServers) && iceServers.length > 0) {
      servers.push(...iceServers);
      console.log('[WebRTC] Dynamic iceServers configured from Xirsys API');
    } else if (url && username && credential) {
      servers.push(
        { urls: `turn:${url}`, username, credential },
        { urls: `turns:${url}`, username, credential }
      );
      console.log('[WebRTC] Static TURN server configured from Backend API');
    } else {
      console.warn('[WebRTC] TURN server not configured on Backend.');
    }
  } catch (error) {
    console.warn('[WebRTC] Failed to fetch TURN credentials from server:', error);
  }

  cachedIceServers = servers;
  return servers;
};

interface UseWebRTCReturn {
  startOutgoingCall: (targetUserId: string, callType: CallType) => Promise<void>;
  answerIncomingCall: (callerId: string) => Promise<void>;
  endCall: (remoteUserId: string) => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export const useWebRTC = (): UseWebRTCReturn => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  // Buffer ICE candidates nhận được trước khi remoteDescription được set
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // Track xem đã set remoteDescription chưa
  const remoteDescSetRef = useRef(false);

  const {
    callType,
    setConnected,
    setLocalStream,
    setRemoteStream,
    reset,
  } = useCallStore();

  // ——— Helper: Dừng stream và đóng PeerConnection ———
  const cleanup = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    remoteDescSetRef.current = false;
  }, []);

  // ——— Helper: Lấy MediaStream từ camera/mic ———
  const getLocalStream = useCallback(async (type: CallType): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
      video: type === 'video'
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Bạn đã từ chối quyền truy cập Camera/Microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.');
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('Không tìm thấy thiết bị Camera hoặc Microphone.');
      }
      throw new Error(`Không thể truy cập thiết bị phương tiện: ${err.message}`);
    }
  }, []);

  // ——— Helper: Tạo RTCPeerConnection ———
  const createPeerConnection = useCallback((
    iceServers: RTCIceServer[],
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onRemoteStream: (stream: MediaStream) => void,
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers,
      // Tối ưu ICE: ưu tiên kết nối tốt nhất
      iceTransportPolicy: 'all',
      // Bundle policy để giảm số lượng kết nối cần thiết
      bundlePolicy: 'max-bundle',
    });

    // Khi tìm được ICE candidate → gửi cho peer qua socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Khi nhận được media stream từ peer
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemoteStream(remoteStream);
        onRemoteStream(remoteStream);
      }
    };

    // Monitor trạng thái kết nối ICE
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('[WebRTC] ICE Connection state:', state);
      if (state === 'connected' || state === 'completed') {
        setConnected();
      } else if (state === 'failed') {
        console.error('[WebRTC] ICE connection failed! Restarting ICE...');
        // Thử restart ICE thay vì huỷ ngay
        pc.restartIce();
      } else if (state === 'disconnected') {
        console.warn('[WebRTC] ICE disconnected — may recover or fail soon.');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] PeerConnection state:', pc.connectionState);
    };

    return pc;
  }, [setConnected, setRemoteStream]);

  // ——— Helper: Flush pending ICE candidates ———
  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const candidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Error adding buffered ICE candidate:', e);
      }
    }
  }, []);

  // ================================================================
  // CALLER SIDE: Gọi đi
  // ================================================================
  const startOutgoingCall = useCallback(async (targetUserId: string, type: CallType) => {
    const socket = getSocket();
    if (!socket) throw new Error('Socket chưa kết nối');

    console.log('[WebRTC] Starting outgoing call to', targetUserId);
    cleanup();

    // 1. Lấy local stream (Tái sử dụng nếu đã cấp quyền từ lúc click GỌI)
    let localStream = useCallStore.getState().localStreamRef;
    if (!localStream) {
      localStream = await getLocalStream(type);
      setLocalStream(localStream);
    }

    // Gắn vào video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // 2. Lấy ICE Servers từ backend và tạo PeerConnection
    const iceServers = await getIceServersAsync();
    const pc = createPeerConnection(
      iceServers,
      (candidate) => {
        socket.emit('call:ice-candidate', { targetUserId, candidate: candidate.toJSON() });
      },
      (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }
    );
    peerConnectionRef.current = pc;

    // 3. Thêm local tracks vào PeerConnection
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // 4. Tạo Offer SDP
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await pc.setLocalDescription(offer);

    // 5. Gửi Offer qua socket
    socket.emit('call:offer', { targetUserId, offer });
    console.log('[WebRTC] Offer sent to', targetUserId);
  }, [cleanup, getLocalStream, createPeerConnection, setLocalStream]);

  // ================================================================
  // CALLEE SIDE: Nhận cuộc gọi và trả lời
  // ================================================================
  const answerIncomingCall = useCallback(async (callerId: string) => {
    const socket = getSocket();
    if (!socket) throw new Error('Socket chưa kết nối');
    const currentCallType = useCallStore.getState().callType || 'audio';

    console.log('[WebRTC] Answering call from', callerId);
    cleanup();

    // 1. Lấy local stream
    const localStream = await getLocalStream(currentCallType);
    setLocalStream(localStream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // 2. Lấy ICE Servers và tạo PeerConnection
    const iceServers = await getIceServersAsync();
    const pc = createPeerConnection(
      iceServers,
      (candidate) => {
        socket.emit('call:ice-candidate', { targetUserId: callerId, candidate: candidate.toJSON() });
      },
      (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }
    );
    peerConnectionRef.current = pc;

    // 3. Thêm local tracks
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // 4. Báo caller biết đã sẵn sàng nhận Offer (signal call:accept)
    socket.emit('call:accept', { callerId });
    // Offer sẽ đến qua event 'call:offer' — xử lý trong useEffect bên dưới
  }, [cleanup, getLocalStream, createPeerConnection, setLocalStream]);

  // ——— Kết thúc cuộc gọi ———
  const endCall = useCallback((remoteUserId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('call:end', { targetUserId: remoteUserId });
    }
    cleanup();
    reset();
  }, [cleanup, reset]);

  // ================================================================
  // Socket event listeners — xử lý tín hiệu WebRTC từ peer
  // ================================================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // ——— Nhận Offer từ Caller (Callee side) ———
    const handleOffer = async ({ callerId, offer }: { callerId: string; offer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn('[WebRTC] Received offer but no PeerConnection exists');
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        console.log('[WebRTC] Remote description (offer) set');

        // Flush buffered candidates
        await flushPendingCandidates(pc);

        // Tạo Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', { targetUserId: callerId, answer });
        console.log('[WebRTC] Answer sent to', callerId);
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    // ——— Nhận Answer từ Callee (Caller side) ———
    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        // Chỉ set nếu chưa có remoteDescription (tránh InvalidStateError)
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          remoteDescSetRef.current = true;
          console.log('[WebRTC] Remote description (answer) set');
          await flushPendingCandidates(pc);
        }
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    };

    // ——— Nhận ICE Candidate từ peer ———
    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (!remoteDescSetRef.current) {
        // Buffer lại nếu remoteDescription chưa được set
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
    };
  }, [flushPendingCandidates]);

  return {
    startOutgoingCall,
    answerIncomingCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
  };
};
