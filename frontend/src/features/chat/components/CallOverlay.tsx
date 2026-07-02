import { useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Loader2,
} from 'lucide-react';
import { useCallStore } from '../../../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { getSocket } from '../../../socket/socket';
import { cn } from '../../../lib/utils';

// ================================================================
// CallOverlay — Giao diện cuộc gọi toàn màn hình (Modal Overlay)
// Mount ở AppProviders / MainLayout để hoạt động toàn cục
// ================================================================

export const CallOverlay = () => {
  const {
    status,
    callType,
    remoteUser,
    incomingCall,
    isMicMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
    setConnecting,
    setLocalStream,
    setRemoteStream,
    reset,
  } = useCallStore();

  const { startOutgoingCall, answerIncomingCall, endCall, localVideoRef, remoteVideoRef } = useWebRTC();

  // Ref cho audio ringtone khi nhận cuộc gọi đến
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  // Ref cho timer tự huỷ nếu không ai bắt máy (30 giây)
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ——— Phát ringtone khi đang ringing ———
  useEffect(() => {
    if (status === 'ringing' || status === 'calling') {
      // Tạo âm thanh rung chuông bằng Web Audio API (không cần file)
      if (!ringtoneRef.current) {
        const audio = new Audio();
        // Sử dụng data URI âm thanh đơn giản hoặc file ringtone của bạn
        // Ví dụ dùng oscillator thay thế nếu không có file
        ringtoneRef.current = audio;
      }
      // Auto timeout 30 giây — nếu không ai bắt máy thì huỷ
      if (status === 'calling') {
        ringTimerRef.current = setTimeout(() => {
          const { remoteUser: ru, callType: ct } = useCallStore.getState();
          if (ru) {
            const socket = getSocket();
            if (socket) {
              socket.emit('call:log', {
                targetUserId: ru.id,
                callType: ct || 'audio',
                status: 'missed'
              });
            }
            endCall(ru.id);
          } else {
            const { incomingCall: ic } = useCallStore.getState();
            if (ic) endCall(ic.callerId);
          }
        }, 30000);
      }
    } else {
      // Dừng ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      if (ringTimerRef.current) {
        clearTimeout(ringTimerRef.current);
        ringTimerRef.current = null;
      }
    }
    return () => {
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    };
  }, [status, endCall]);

  // ——— Gắn stream vào video elements khi stream thay đổi ———
  const localStream = useCallStore((s) => s.localStreamRef);
  const remoteStream = useCallStore((s) => s.remoteStreamRef);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef]);

  // ——— Socket listeners cho call events toàn cục ———
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Caller nhận phản hồi: cuộc gọi bị từ chối
    const handleRejected = () => {
      endCall('');
      reset();
    };

    // Cả 2 nhận: cuộc gọi kết thúc
    const handleEnded = () => {
      endCall(''); // cleanup local
      reset();
    };

    // Caller: Callee đã chấp nhận → bắt đầu gửi Offer
    const handleAccepted = async ({ calleeId }: { calleeId: string }) => {
      setConnecting();
      const { callType: ct } = useCallStore.getState();
      if (ct) {
        try {
          await startOutgoingCall(calleeId, ct);
        } catch (err: any) {
          console.error('[Call] Failed to start outgoing call after accept:', err.message);
          setTimeout(() => alert(`Không thể gọi: ${err.message}`), 100);
          endCall(calleeId);
        }
      }
    };

    // Call error (vd: USER_OFFLINE)
    const handleError = ({ message }: { message: string }) => {
      alert(`Cuộc gọi thất bại: ${message}`);
      reset();
    };

    socket.on('call:rejected', handleRejected);
    socket.on('call:ended', handleEnded);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:error', handleError);

    return () => {
      socket.off('call:rejected', handleRejected);
      socket.off('call:ended', handleEnded);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:error', handleError);
    };
  }, [endCall, reset, setConnecting, startOutgoingCall]);

  // ——— Âm thanh đổ chuông (Ringtone) ———
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    if (status === 'ringing' || status === 'calling') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();
          
          const playRing = () => {
            if (!audioCtx) return;
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            // Tạo âm thanh kiểu điện thoại đổ chuông (tone ghép)
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.value = status === 'calling' ? 440 : 480;
            osc2.frequency.value = status === 'calling' ? 480 : 440;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Volume envelope
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + 1.2);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);

            osc1.start(audioCtx.currentTime);
            osc2.start(audioCtx.currentTime);
            osc1.stop(audioCtx.currentTime + 1.5);
            osc2.stop(audioCtx.currentTime + 1.5);
          };

          playRing();
          // Lặp lại mỗi 2.5 giây
          interval = setInterval(playRing, 2500);
        }
      } catch (err) {
        console.warn('[Call] Web Audio API bị chặn hoặc không hỗ trợ:', err);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [status]);

  // ——— Handler: Chấp nhận cuộc gọi đến ———
  const handleAnswer = useCallback(async () => {
    if (!incomingCall) return;
    setConnecting();
    try {
      await answerIncomingCall(incomingCall.callerId);
    } catch (err: any) {
      alert(`Không thể tham gia cuộc gọi: ${err.message}`);
      reset();
    }
  }, [incomingCall, setConnecting, answerIncomingCall, reset]);

  // ——— Handler: Từ chối cuộc gọi đến ———
  const handleReject = useCallback(() => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('call:reject', { callerId: incomingCall.callerId, reason: 'declined' });
      // Ghi log cuộc gọi bị từ chối
      socket.emit('call:log', {
        targetUserId: incomingCall.callerId,
        callType: incomingCall.callType,
        status: 'rejected'
      });
    }
    reset();
  }, [incomingCall, reset]);

  // ——— Helper tính thời lượng cuộc gọi ———
  const getCallDuration = useCallback(() => {
    const { connectedAt } = useCallStore.getState();
    if (!connectedAt) return undefined;
    return Math.floor((Date.now() - connectedAt) / 1000).toString();
  }, []);

  // ——— Handler: Gác máy ———
  const handleHangUp = useCallback(() => {
    const { status: currentStatus, callType: ct } = useCallStore.getState();
    const remoteId = remoteUser?.id || incomingCall?.callerId || '';
    
    const socket = getSocket();
    if (socket && remoteId) {
      let callStatus = 'ended';
      if (currentStatus === 'calling') callStatus = 'missed'; // Caller dập máy trước khi bắt

      socket.emit('call:log', {
        targetUserId: remoteId,
        callType: ct || incomingCall?.callType || 'audio',
        status: callStatus,
        duration: callStatus === 'ended' ? getCallDuration() : undefined
      });
    }
    
    endCall(remoteId);
  }, [remoteUser, incomingCall, endCall, getCallDuration]);

  // ——— Không render gì nếu đang idle ———
  if (status === 'idle') return null;

  // ——— Tên người kia để hiển thị ———
  const remoteName =
    incomingCall?.callerInfo.name || remoteUser?.name || 'Người dùng';
  const remoteAvatar =
    incomingCall?.callerInfo.avatarUrl || remoteUser?.avatarUrl;
  const isVideoCall = callType === 'video';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'animate-in fade-in duration-300',
        // Background: video nền khi có video call, gradient khi chỉ audio
        isVideoCall && status === 'connected'
          ? 'bg-black'
          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
      )}
    >
      {/* ========================================================= */}
      {/* Video streams (chỉ hiện khi gọi video) */}
      {/* ========================================================= */}
      {isVideoCall && (
        <>
          {/* Remote video — phóng to toàn màn hình */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              status !== 'connected' && 'hidden'
            )}
          />

          {/* Local video — thu nhỏ ở góc dưới phải */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // PHẢI mute local video để tránh echo
            className={cn(
              'absolute bottom-28 right-4 w-32 h-44 sm:w-40 sm:h-56 object-cover rounded-2xl border-2 border-white/20 shadow-2xl z-10 transition-all',
              isCameraOff && 'hidden',
              status !== 'connected' && 'hidden'
            )}
          />
        </>
      )}

      {/* ========================================================= */}
      {/* Audio call / Waiting state — hiện Avatar + Tên */}
      {/* ========================================================= */}
      <div
        className={cn(
          'relative z-10 flex flex-col items-center gap-4',
          isVideoCall && status === 'connected' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
            {remoteAvatar ? (
              <img src={remoteAvatar} alt={remoteName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold">
                {remoteName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Ripple animation khi đang gọi / ringing */}
          {(status === 'calling' || status === 'ringing') && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
              <span className="absolute -inset-2 rounded-full border-2 border-white/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
            </>
          )}
        </div>

        {/* Tên người kia */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow">{remoteName}</h2>

        {/* Trạng thái cuộc gọi */}
        <div className="flex items-center gap-2 text-white/70 text-sm">
          {status === 'calling' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang gọi...</span>
            </>
          )}
          {status === 'ringing' && (
            <span className="animate-pulse">
              📞 {isVideoCall ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
            </span>
          )}
          {status === 'connecting' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kết nối...</span>
            </>
          )}
          {status === 'connected' && !isVideoCall && (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-emerald-400 font-medium">Đang trong cuộc gọi</span>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* HUD trên video (tên + timer) khi đang connected video call */}
      {/* ========================================================= */}
      {isVideoCall && status === 'connected' && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-sm font-medium">{remoteName}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* Control buttons */}
      {/* ========================================================= */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-4 sm:gap-6 px-6">

        {/* ——— Incoming call: Từ chối + Chấp nhận ——— */}
        {status === 'ringing' && (
          <>
            <CallBtn
              onClick={handleReject}
              color="red"
              icon={<PhoneMissed className="w-7 h-7" />}
              label="Từ chối"
            />
            <CallBtn
              onClick={handleAnswer}
              color="green"
              icon={<Phone className="w-7 h-7" />}
              label="Bắt máy"
            />
          </>
        )}

        {/* ——— Outgoing call: Chỉ có nút Huỷ ——— */}
        {status === 'calling' && (
          <CallBtn
            onClick={handleHangUp}
            color="red"
            icon={<PhoneOff className="w-7 h-7" />}
            label="Huỷ"
          />
        )}

        {/* ——— Connecting / Connected: Controls đầy đủ ——— */}
        {(status === 'connecting' || status === 'connected') && (
          <>
            {/* Mic */}
            <CallBtn
              onClick={toggleMic}
              color="gray"
              icon={isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              label={isMicMuted ? 'Bật mic' : 'Tắt mic'}
              active={isMicMuted}
            />

            {/* Camera (chỉ hiện nếu là video call) */}
            {isVideoCall && (
              <CallBtn
                onClick={toggleCamera}
                color="gray"
                icon={isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                label={isCameraOff ? 'Bật cam' : 'Tắt cam'}
                active={isCameraOff}
              />
            )}

            {/* Gác máy */}
            <CallBtn
              onClick={handleHangUp}
              color="red"
              icon={<PhoneOff className="w-7 h-7" />}
              label="Gác máy"
            />
          </>
        )}
      </div>
    </div>
  );
};

// ——— CallBtn component ———
interface CallBtnProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'red' | 'green' | 'gray';
  active?: boolean; // Khi active (vd: mic đang tắt) → đổi màu
}

const CallBtn = ({ onClick, icon, label, color, active }: CallBtnProps) => {
  const colorMap = {
    red: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40',
    green: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/40',
    gray: active
      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
      : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10',
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={cn(
          'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg',
          'hover:scale-110 active:scale-95',
          colorMap[color]
        )}
      >
        {icon}
      </button>
      <span className="text-white/70 text-xs font-medium">{label}</span>
    </div>
  );
};

export default CallOverlay;
