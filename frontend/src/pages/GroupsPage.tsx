import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Users, Lock, Globe, UserPlus, Bell, ChevronRight,
  BookOpen, Crown, CheckCircle, X, Compass, LayoutGrid, Upload,
  Sparkles, FileText, Loader2, AlertCircle, UserCheck, Eye, Clock
} from 'lucide-react';
import {
  createGroupApi,
  getMyGroupsApi,
  searchGroupsApi,
  getReceivedInvitationsApi,
  acceptInvitationApi,
  rejectInvitationApi,
  joinRequestApi,
} from '../features/group/services/group.service';
import type {
  GroupVisibility,
  GroupRole,
  GroupWithRole,
  GroupData,
  InvitationData,
  CreateGroupPayload,
} from '../features/group/services/group.service';
import AvatarUpload from '../components/common/AvatarUpload';

// ——— Helpers
const getInitials = (name?: string) => {
  if (!name || typeof name !== 'string') return 'G';
  const words = name.trim().split(/\s+/);
  return words.slice(-2).map(w => w[0] || '').join('').toUpperCase() || 'G';
};

const COVER_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-indigo-500',
  'from-rose-500 to-red-600',
  'from-green-500 to-emerald-600',
];

const getCoverColor = (id?: string) => {
  if (!id) return COVER_COLORS[0];
  const code = id.charCodeAt(id.length - 1);
  return COVER_COLORS[isNaN(code) ? 0 : code % COVER_COLORS.length];
};

const VisibilityBadge = ({ visibility }: { visibility: GroupVisibility }) => {
  const map = {
    PUBLIC: { label: 'Công khai', icon: Globe, color: 'text-emerald-600 bg-emerald-50' },
    PRIVATE: { label: 'Riêng tư', icon: Lock, color: 'text-slate-600 bg-slate-100' },
    INVITE: { label: 'Invite-only', icon: UserPlus, color: 'text-violet-600 bg-violet-50' },
  };
  const { label, icon: Icon, color } = map[visibility];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

const RoleBadge = ({ role }: { role: string }) => {
  const map: Record<string, { label: string, icon: React.ElementType, cls: string }> = {
    OWNER: { label: 'Chủ nhóm', icon: Crown, cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    MEMBER: { label: 'Thành viên', icon: UserCheck, cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    VIEWER: { label: 'Chỉ xem', icon: Eye, cls: 'text-slate-600 bg-slate-50 border-slate-200' },
    PENDING: { label: 'Chờ duyệt', icon: Clock, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  };
  const fallback = { label: role, icon: UserCheck, cls: 'text-slate-600 bg-slate-50 border-slate-200' };
  const { label, icon: Icon, cls } = map[role] || fallback;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

// ——— Create Group Modal
interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}
const CreateGroupModal = ({ onClose, onCreated }: CreateGroupModalProps) => {
  const [form, setForm] = useState<CreateGroupPayload>({
    name: '',
    description: '',
    visibility: 'PUBLIC',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await createGroupApi(form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tạo nhóm thất bại, thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800">Tạo nhóm học tập</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Kết nối và học cùng nhau</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border-0 bg-transparent cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Avatar upload */}
          <div className="flex justify-center">
            <AvatarUpload
              value={form.avatarUrl}
              onChange={(url) => setForm(f => ({ ...f, avatarUrl: url }))}
              nameInitial={form.name || 'G'}
              className="w-20 h-20"
            />
          </div>

          {/* Tên nhóm */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên nhóm *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Toán Cao Cấp A1, Nhóm Dự Án..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Mô tả nhóm</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mục tiêu học tập, nội dung trao đổi..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium resize-none"
            />
          </div>

          {/* Quyền riêng tư */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Quyền riêng tư</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'PUBLIC', label: 'Công khai', icon: Globe, desc: 'Ai cũng thấy' },
                { value: 'INVITE', label: 'Invite-only', icon: UserPlus, desc: 'Phải được mời' },
                { value: 'PRIVATE', label: 'Riêng tư', icon: Lock, desc: 'Chỉ thành viên' },
              ] as const).map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, visibility: value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    form.visibility === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{label}</span>
                  <span className="text-[9px] text-center leading-tight opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nút Tạo */}
          <button
            type="submit"
            disabled={isSubmitting || !form.name.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-all active:scale-95 cursor-pointer border-0 outline-none flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ——— Discover Group Card
const DiscoverGroupCard = ({ group, onJoined }: { group: GroupData; onJoined?: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>(
    group.joinStatus === 'pending' ? 'done' : 'idle'
  );
  const coverColor = getCoverColor(group.id);
  const navigate = useNavigate();

  useEffect(() => {
    setStatus(group.joinStatus === 'pending' ? 'done' : 'idle');
  }, [group.joinStatus]);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus('loading');
    try {
      await joinRequestApi(group.id);
      setStatus('done');
      onJoined?.();
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div 
      onClick={() => navigate(`/groups/${group.id}`)}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group cursor-pointer"
    >
      <div className={`h-20 bg-gradient-to-br ${coverColor} relative`}>
        {group.coverUrl && (
          <img src={group.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="p-4">
        <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
          {group.name}
        </h4>
        <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-2 leading-snug">{group.description}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">{group.memberCount?.toLocaleString() ?? 0}</span>
            <VisibilityBadge visibility={group.visibility} />
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={status === 'loading' || status === 'done'}
          className={`w-full mt-3 py-2 text-xs font-bold rounded-xl transition-all border-0 cursor-pointer outline-none active:scale-95 flex items-center justify-center gap-1.5 ${
            status === 'done'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {status === 'loading' 
            ? 'Đang xử lý...' 
            : status === 'done' 
              ? 'Đang chờ duyệt'
              : 'Xin tham gia'}
        </button>
      </div>
    </div>
  );
};

// ——— Invitation Card trong sidebar
const InvitationCard = ({ inv, onAccepted, onRejected }: {
  inv: InvitationData;
  onAccepted: () => void;
  onRejected: () => void;
}) => {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const coverColor = getCoverColor(inv.group.id);

  const handleAccept = async () => {
    setLoading('accept');
    try {
      await acceptInvitationApi(inv.id);
      onAccepted();
    } catch {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await rejectInvitationApi(inv.id);
      onRejected();
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${coverColor} shrink-0 overflow-hidden relative`}>
          {inv.group.avatarUrl && (
            <img src={inv.group.avatarUrl} alt={inv.group.name} className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-800 truncate">{inv.group.name}</p>
          <p className="text-[10px] text-slate-400">Được mời bởi {inv.sender?.name || 'Ai đó'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleAccept}
          disabled={loading !== null}
          className="py-1.5 text-[11px] font-bold bg-indigo-600 text-white rounded-lg cursor-pointer border-0 hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-1"
        >
          {loading === 'accept' && <Loader2 className="w-3 h-3 animate-spin" />}
          Chấp nhận
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="py-1.5 text-[11px] font-bold bg-white text-slate-500 rounded-lg cursor-pointer border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-60 flex items-center justify-center gap-1"
        >
          {loading === 'reject' && <Loader2 className="w-3 h-3 animate-spin" />}
          Từ chối
        </button>
      </div>
    </div>
  );
};

// ——— Main Component
const GroupsPage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'my-groups' | 'discover'>('my-groups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // My groups state
  const [myGroups, setMyGroups] = useState<GroupWithRole[]>([]);
  const [myGroupsLoading, setMyGroupsLoading] = useState(true);
  const [myGroupsError, setMyGroupsError] = useState('');

  // Discover state
  const [discoverGroups, setDiscoverGroups] = useState<GroupData[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverKeyword, setDiscoverKeyword] = useState('');

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationData[]>([]);

  // ——— Fetch my groups
  const fetchMyGroups = useCallback(async () => {
    setMyGroupsLoading(true);
    setMyGroupsError('');
    try {
      const res = await getMyGroupsApi(searchQuery || undefined);
      setMyGroups(res.data?.data ?? []);
    } catch {
      setMyGroupsError('Không thể tải danh sách nhóm. Thử lại sau.');
    } finally {
      setMyGroupsLoading(false);
    }
  }, [searchQuery]);

  // ——— Fetch invitations
  const fetchInvitations = useCallback(async () => {
    try {
      const res = await getReceivedInvitationsApi();
      const pending = (res.data?.data ?? []).filter(inv => inv.status === 'PENDING');
      setInvitations(pending);
    } catch {
      // silent fail
    }
  }, []);

  // ——— Fetch discover groups
  const fetchDiscoverGroups = useCallback(async (keyword: string) => {
    setDiscoverLoading(true);
    try {
      const res = await searchGroupsApi(keyword);
      setDiscoverGroups(res.data?.data ?? []);
    } catch {
      // silent fail
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    if (activeView === 'discover') {
      fetchDiscoverGroups(discoverKeyword);
    }
  }, [activeView, discoverKeyword, fetchDiscoverGroups]);

  // Debounced discover search
  useEffect(() => {
    if (activeView !== 'discover') return;
    const timer = setTimeout(() => fetchDiscoverGroups(discoverKeyword), 400);
    return () => clearTimeout(timer);
  }, [discoverKeyword, activeView]);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* ——— Header ——— */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Nhóm học tập</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">Học cùng nhau, tiến bộ hơn</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-indigo-200 active:scale-95 cursor-pointer border-0 outline-none"
        >
          <Plus className="w-4 h-4" />
          Tạo nhóm
        </button>
      </div>

      {/* ——— Main Layout ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ===== Cột TRÁI: Sidebar ===== */}
        <div className="lg:col-span-3 space-y-4">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhóm của bạn..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium"
            />
          </div>

          {/* Nav tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">Nhóm của bạn</p>
            {[
              { id: 'my-groups', label: 'Nhóm đã tham gia', icon: LayoutGrid, count: myGroups.length },
              { id: 'discover', label: 'Khám phá nhóm mới', icon: Compass, count: null },
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border-0 outline-none ${
                  activeView === id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
                {count !== null && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Lời mời đang chờ */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-slate-700">Lời mời tham gia</p>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                  {invitations.length}
                </span>
              </div>
              {invitations.map(inv => (
                <InvitationCard
                  key={inv.id}
                  inv={inv}
                  onAccepted={() => {
                    fetchInvitations();
                    fetchMyGroups();
                  }}
                  onRejected={fetchInvitations}
                />
              ))}
            </div>
          )}
        </div>

        {/* ===== Cột GIỮA + PHẢI: Nội dung chính ===== */}
        <div className="lg:col-span-9">
          {/* ——— VIEW 1: Nhóm đã tham gia ——— */}
          {activeView === 'my-groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-800">
                  Nhóm đã tham gia <span className="text-slate-400 font-bold">({myGroups.length})</span>
                </h2>
              </div>

              {myGroupsLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Đang tải danh sách nhóm...</p>
                </div>
              ) : myGroupsError ? (
                <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">{myGroupsError}</p>
                  <button
                    onClick={fetchMyGroups}
                    className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl border-0 cursor-pointer hover:bg-indigo-100 transition-all"
                  >
                    Thử lại
                  </button>
                </div>
              ) : myGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-500">Chưa tham gia nhóm nào</p>
                  <button
                    onClick={() => setActiveView('discover')}
                    className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl border-0 cursor-pointer hover:bg-indigo-100 transition-all"
                  >
                    Khám phá nhóm mới
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myGroups.map(group => {
                    const coverColor = getCoverColor(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      >
                        {/* Cover */}
                        <div className={`h-24 bg-gradient-to-br ${coverColor} relative`}>
                          {group.coverUrl && (
                            <img src={group.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/10" />
                          {group.myRole && (
                            <span className="absolute top-2 right-2">
                              <RoleBadge role={group.myRole} />
                            </span>
                          )}
                          <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white overflow-hidden">
                            {group.avatarUrl ? (
                              <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-black text-indigo-600">{(group.name || 'G').charAt(0)}</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-7 px-4 pb-4">
                          <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{group.description}</p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-500">{group.memberCount} thành viên</span>
                            <span className="ml-auto">
                              <VisibilityBadge visibility={group.visibility} />
                            </span>
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/groups/${group.id}`); }}
                              className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-0 cursor-pointer transition-all active:scale-95"
                            >
                              Vào nhóm
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/groups/${group.id}?tab=members`); }}
                              className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer transition-all"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Card Tạo nhóm mới */}
                  <div
                    onClick={() => setShowCreateModal(true)}
                    className="bg-white rounded-2xl border-2 border-dashed border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[180px] group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-all">
                      <Plus className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">Tạo nhóm mới</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ——— VIEW 2: Khám phá nhóm ——— */}
          {activeView === 'discover' && (
            <div className="space-y-5">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={discoverKeyword}
                  onChange={e => setDiscoverKeyword(e.target.value)}
                  placeholder="Tìm kiếm nhóm học tập..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all font-medium"
                />
              </div>

              {/* Nhóm theo chủ đề */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Theo môn học</h3>
                <div className="flex flex-wrap gap-2">
                  {['Toán', 'Lý', 'Hóa', 'Văn', 'Anh', 'Lập trình', 'AI/ML', 'Thiết kế', 'Kinh tế'].map(subject => (
                    <button
                      key={subject}
                      onClick={() => setDiscoverKeyword(subject)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách nhóm discover */}
              <div>
                <h2 className="text-base font-extrabold text-slate-800 mb-3">
                  {discoverKeyword ? `Kết quả cho "${discoverKeyword}"` : 'Nhóm học tập nổi bật'}
                </h2>
                {discoverLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Đang tìm kiếm nhóm...</p>
                  </div>
                ) : (() => {
                  const filteredDiscover = discoverGroups.filter(g => !myGroups.some(my => my.id === g.id));
                  return filteredDiscover.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-500">Không tìm thấy nhóm phù hợp chưa tham gia</p>
                      <p className="text-xs text-slate-400 mt-1">Thử từ khóa khác hoặc tạo nhóm mới</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredDiscover.map(group => (
                        <DiscoverGroupCard
                          key={group.id}
                          group={group}
                          onJoined={fetchMyGroups}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ——— Create Group Modal ——— */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchMyGroups}
        />
      )}
    </div>
  );
};

export default GroupsPage;
