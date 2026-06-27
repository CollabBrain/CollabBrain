import { create } from 'zustand';

// ——— Types ———
export type CallStatus =
  | 'idle'        // Không có cuộc gọi
  | 'calling'     // Đang gọi đi (chờ người kia bắt máy)
  | 'ringing'     // Đang rung chuông (nhận cuộc gọi đến)
  | 'connecting'  // Đã chấp nhận, đang thiết lập WebRTC P2P
  | 'connected';  // Đã kết nối thành công

export type CallType = 'audio' | 'video';

export interface CallerInfo {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface CallState {
  status: CallStatus;
  callType: CallType | null;
  connectedAt: number | null; // Track thời gian bắt đầu call để tính duration

  // Người gọi đi (khi mình là Caller)
  remoteUser: CallerInfo | null;
  // Thông tin cuộc gọi đến (khi mình là Callee)
  incomingCall: {
    callerId: string;
    callType: CallType;
    callerInfo: { name: string; avatarUrl?: string | null };
  } | null;

  // Streams — KHÔNG lưu vào Zustand (MediaStream không serializable)
  // Chỉ lưu references để cleanup, dùng ref trong component
  localStreamRef: MediaStream | null;
  remoteStreamRef: MediaStream | null;

  // UI controls
  isMicMuted: boolean;
  isCameraOff: boolean;

  // ——— Actions ———
  startCall: (remoteUser: CallerInfo, callType: CallType) => void;
  setIncomingCall: (data: CallState['incomingCall']) => void;
  setConnecting: () => void;
  setConnected: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  callType: null,
  connectedAt: null,
  remoteUser: null,
  incomingCall: null,
  localStreamRef: null,
  remoteStreamRef: null,
  isMicMuted: false,
  isCameraOff: false,
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  startCall: (remoteUser, callType) =>
    set({ status: 'calling', callType, remoteUser, incomingCall: null }),

  setIncomingCall: (data) =>
    set({ status: 'ringing', incomingCall: data }),

  setConnecting: () =>
    set({ status: 'connecting' }),

  setConnected: () =>
    set({ status: 'connected', connectedAt: Date.now() }),

  setLocalStream: (stream) =>
    set({ localStreamRef: stream }),

  setRemoteStream: (stream) =>
    set({ remoteStreamRef: stream }),

  toggleMic: () => {
    const { localStreamRef, isMicMuted } = get();
    if (localStreamRef) {
      localStreamRef.getAudioTracks().forEach((t) => { t.enabled = isMicMuted; });
    }
    set({ isMicMuted: !isMicMuted });
  },

  toggleCamera: () => {
    const { localStreamRef, isCameraOff } = get();
    if (localStreamRef) {
      localStreamRef.getVideoTracks().forEach((t) => { t.enabled = isCameraOff; });
    }
    set({ isCameraOff: !isCameraOff });
  },

  reset: () => {
    // Dừng tất cả tracks trước khi reset để giải phóng camera/mic
    const { localStreamRef, remoteStreamRef } = get();
    localStreamRef?.getTracks().forEach((t) => t.stop());
    remoteStreamRef?.getTracks().forEach((t) => t.stop());
    set({ ...initialState });
  },
}));
