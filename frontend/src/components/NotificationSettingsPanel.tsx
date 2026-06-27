import { useNotificationSettings, useUpdateNotificationSettings, type NotificationSettings } from '../hooks/useNotificationSettings';
import { Bell, MessageCircle, UserPlus, Users, Settings as SettingsIcon, Volume2, Vibrate, Star } from 'lucide-react';

export const NotificationSettingsPanel = () => {
  const { data: settings = {
    enableAll: true,
    enableChat: true,
    enableFriend: true,
    enableGroup: true,
    enableSystem: true,
    enableSound: true,
    enableVibrate: true,
    chatPriority: 'HIGH' as const
  }} = useNotificationSettings();
  
  const updateMutation = useUpdateNotificationSettings();

  const handleToggle = (key: keyof Omit<NotificationSettings, 'chatPriority'>, value: boolean) => {
    updateMutation.mutate({ [key]: value } as Partial<NotificationSettings>);
  };

  const handlePriorityChange = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    updateMutation.mutate({ chatPriority: priority });
  };

  const priorities = [
    { value: 'HIGH' as const, label: 'Cao', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { value: 'MEDIUM' as const, label: 'Trung bình', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'LOW' as const, label: 'Thấp', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Cài đặt thông báo</h2>
          <p className="text-xs text-slate-500 font-medium">Quản lý cách bạn nhận thông báo</p>
        </div>
      </div>

      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-50/50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-200/60 text-slate-600 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Bật tất cả thông báo</p>
            <p className="text-[10px] text-slate-500 font-medium">Tắt để tạm ngừng mọi thông báo</p>
          </div>
        </div>
        <ToggleSwitch 
          enabled={settings.enableAll} 
          onChange={(v) => handleToggle('enableAll', v)}
        />
      </div>

      {/* Notification Types */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Loại thông báo</h3>
        
        {/* Chat Messages - HIGH priority by default */}
        <NotificationToggle
          icon={<MessageCircle className="w-4 h-4" />}
          iconBg="bg-rose-50 text-rose-600"
          title="Tin nhắn chat"
          description="Thông báo khi có tin nhắn mới"
          enabled={settings.enableChat}
          onChange={(v) => handleToggle('enableChat', v)}
          priority={settings.chatPriority === 'HIGH' ? 'HIGH' : undefined}
        />

        {/* Friend Requests */}
        <NotificationToggle
          icon={<UserPlus className="w-4 h-4" />}
          iconBg="bg-amber-50 text-amber-600"
          title="Lời mời kết bạn"
          description="Thông báo khi có yêu cầu kết bạn mới"
          enabled={settings.enableFriend}
          onChange={(v) => handleToggle('enableFriend', v)}
        />

        {/* Group Notifications */}
        <NotificationToggle
          icon={<Users className="w-4 h-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
          title="Thông báo nhóm"
          description="Lời mời, tin nhắn nhóm"
          enabled={settings.enableGroup}
          onChange={(v) => handleToggle('enableGroup', v)}
        />

        {/* System Notifications */}
        <NotificationToggle
          icon={<SettingsIcon className="w-4 h-4" />}
          iconBg="bg-slate-100 text-slate-600"
          title="Thông báo hệ thống"
          description="Cập nhật, thông tin tài khoản"
          enabled={settings.enableSystem}
          onChange={(v) => handleToggle('enableSystem', v)}
        />
      </div>

      {/* Chat Priority */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Ưu tiên tin nhắn chat</h3>
        <div className="flex gap-2">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePriorityChange(p.value)}
              className={[
                'flex-1 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                settings.chatPriority === p.value
                  ? `${p.color} border-2 shadow-sm`
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
              ].join(' ')}
            >
              {settings.chatPriority === p.value && <Star className="w-3 h-3 inline-block mr-1 fill-current" />}
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 font-medium px-1">
          Tin nhắn chat sẽ nổi bật hơn các thông báo khác khi có tin nhắn mới
        </p>
      </div>

      {/* Sound & Vibration */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Âm thanh & Rung</h3>
        
        <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Âm thanh thông báo</span>
          </div>
          <ToggleSwitch 
            enabled={settings.enableSound} 
            onChange={(v) => handleToggle('enableSound', v)}
          />
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Vibrate className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Rung khi có thông báo</span>
          </div>
          <ToggleSwitch 
            enabled={settings.enableVibrate} 
            onChange={(v) => handleToggle('enableVibrate', v)}
          />
        </div>
      </div>

      {/* Save indicator */}
      {updateMutation.isPending && (
        <p className="text-xs text-indigo-600 font-medium text-center animate-pulse">
          Đang lưu...
        </p>
      )}
      {updateMutation.isSuccess && (
        <p className="text-xs text-emerald-600 font-medium text-center">
          Đã lưu thay đổi
        </p>
      )}
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={[
      'relative w-12 h-6 rounded-full transition-all duration-200 border-0 cursor-pointer outline-none',
      enabled ? 'bg-indigo-600' : 'bg-slate-200'
    ].join(' ')}
  >
    <span
      className={[
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200',
        enabled ? 'left-[26px]' : 'left-0.5'
      ].join(' ')}
    />
  </button>
);

// Notification Toggle Row
const NotificationToggle = ({
  icon,
  iconBg,
  title,
  description,
  enabled,
  onChange,
  priority
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}) => (
  <div className={[
    'flex items-center justify-between p-4 rounded-2xl border transition-all duration-200',
    enabled ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-slate-50'
  ].join(' ')}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={[
            'text-sm font-bold',
            enabled ? 'text-slate-800' : 'text-slate-400'
          ].join(' ')}>
            {title}
          </span>
          {priority === 'HIGH' && (
            <span className="px-1.5 py-0.5 text-[8px] font-black text-rose-600 bg-rose-50 rounded-md">
              ƯU TIÊN CAO
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-medium">{description}</p>
      </div>
    </div>
    <ToggleSwitch enabled={enabled} onChange={onChange} />
  </div>
);
