import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useFriends } from '../hooks/useFriends';
import {
  ArrowLeft, MessageSquare, Users, Settings, LogOut, Crown, MoreHorizontal,
  UserPlus, Search, Eye, Trash2, Globe, Lock, UserCheck,
  BookOpen, FileText, CheckCircle, X, Bell, Upload, GraduationCap,
  Hash, ClipboardList, ChevronDown, Clock, Loader2, AlertCircle, RefreshCw,
  MoreVertical, Download, Image as ImageIcon, File as FileIcon, CheckCircle2, FileSpreadsheet, FileIcon as FilePowerpoint, Camera
} from 'lucide-react';
import {
  uploadGroupDocumentApi,
  getGroupDocumentsApi,
  softDeleteDocumentApi,
  downloadDocumentApi,
} from '../features/group/services/document.service';
import type { DocumentData } from '../features/group/services/document.service';
import {
  getGroupInfoApi,
  getGroupMembersApi,
  getJoinRequestsApi,
  joinRequestApi,
  leaveGroupApi,
  removeMemberApi,
  changeRoleApi,
  acceptJoinRequestApi,
  rejectJoinRequestApi,
  inviteMemberApi,
  updateGroupApi,
  deleteGroupApi,
} from '../features/group/services/group.service';
import type {
  GroupWithRole,
  GroupVisibility,
  GroupRole,
  MemberData,
  JoinRequestData,
  UpdateGroupPayload,
} from '../features/group/services/group.service';
import AvatarUpload from '../components/common/AvatarUpload';
import axiosInstance from '../services/axiosInstance';

// ——— Types
type ActiveTab = 'chat' | 'members' | 'documents' | 'settings';
type MembershipStatus = 'OWNER' | 'MEMBER' | 'VIEWER' | 'PENDING' | 'NOT_MEMBER';

// ——— Helpers
const getInitials = (name: string) => name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

const COVER_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-indigo-500',
];
const getCoverGradient = (id: string) => {
  const idx = id.charCodeAt(id.length - 1) % COVER_COLORS.length;
  const stops = COVER_COLORS[idx].replace('from-', '').replace('to-', '').split(' ');
  return `linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)`;
};
const getCoverColor = (id: string) =>
  COVER_COLORS[id.charCodeAt(id.length - 1) % COVER_COLORS.length];

const RoleBadge = ({ role }: { role: GroupRole }) => {
  const map = {
    OWNER: { label: 'Chủ nhóm', icon: Crown, cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    MEMBER: { label: 'Thành viên', icon: UserCheck, cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    VIEWER: { label: 'Chỉ xem', icon: Eye, cls: 'text-slate-600 bg-slate-50 border-slate-200' },
  };
  const { label, icon: Icon, cls } = map[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

const AvatarCircle = ({ name, avatarUrl, size = 'md', gradient = 'from-indigo-500 to-purple-600', isOnline }: {
  name: string; avatarUrl?: string; size?: 'sm' | 'md' | 'lg'; gradient?: string; isOnline?: boolean;
}) => {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div className="relative shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold overflow-hidden`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {isOnline !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      )}
    </div>
  );
};

// ——— Tab: Members
const MembersTab = ({
  group,
  members,
  membersLoading,
  joinRequests,
  joinRequestsLoading,
  onMembersChange,
  onInviteClick,
}: {
  group: GroupWithRole;
  members: MemberData[];
  membersLoading: boolean;
  joinRequests: JoinRequestData[];
  joinRequestsLoading: boolean;
  onMembersChange: () => void;
  onInviteClick: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = members.filter(m =>
    (m.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.user?.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const owners = filtered.filter(m => m.role === 'OWNER');
  const others = filtered.filter(m => m.role !== 'OWNER');
  const isOwner = group.myRole === 'OWNER';

  const handleRoleChange = async (memberId: string, role: GroupRole) => {
    setActionLoading(`role-${memberId}`);
    try {
      await changeRoleApi(group.id, memberId, role);
      onMembersChange();
    } catch {
      // silent fail
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleKick = async (memberId: string) => {
    setActionLoading(`kick-${memberId}`);
    try {
      await removeMemberApi(group.id, memberId);
      onMembersChange();
    } catch {
      // silent fail
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleAcceptRequest = async (req: JoinRequestData) => {
    setActionLoading(`accept-${req.id}`);
    try {
      await acceptJoinRequestApi(group.id, req.id);
      onMembersChange();
    } catch {
      // silent fail
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (req: JoinRequestData) => {
    setActionLoading(`reject-${req.id}`);
    try {
      await rejectJoinRequestApi(group.id, req.id);
      onMembersChange();
    } catch {
      // silent fail
    } finally {
      setActionLoading(null);
    }
  };

  const MemberRow = ({ member }: { member: MemberData }) => (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-indigo-50/30 transition-colors group relative last:rounded-b-2xl">
      <AvatarCircle name={member.user?.name || 'Unknown'} avatarUrl={member.user?.avatarUrl} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800">{member.user?.name || 'Unknown User'}</p>
          <RoleBadge role={member.role} />
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{member.user?.email || ''}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isOwner && member.role !== 'OWNER' && (
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === member.userId ? null : member.userId)}
              className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg border-0 bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
            >
              {actionLoading?.startsWith(`kick-${member.userId}`) || actionLoading?.startsWith(`role-${member.userId}`)
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <MoreHorizontal className="w-4 h-4" />
              }
            </button>
            {openDropdown === member.userId && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                <div className="absolute right-0 top-9 z-30 w-44 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-2 space-y-0.5">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đổi vai trò</p>
                    {(['MEMBER', 'VIEWER'] as GroupRole[]).map(role => (
                      <button key={role} onClick={() => handleRoleChange(member.userId, role)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border-0 cursor-pointer transition-all text-left ${member.role === role ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {role === 'MEMBER' ? <UserCheck className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {role === 'MEMBER' ? 'Thành viên' : 'Chỉ xem'}
                        {member.role === role && <CheckCircle className="w-3 h-3 ml-auto text-indigo-500" />}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button onClick={() => handleKick(member.userId)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border-0 cursor-pointer transition-all">
                        <LogOut className="w-3.5 h-3.5" />
                        Mời ra khỏi nhóm
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm thành viên theo tên, email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
        </div>
        {isOwner && (
          <button onClick={onInviteClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200 shrink-0">
            <UserPlus className="w-4 h-4" />
            Mời thành viên
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-3">
        {[
          { label: 'Tổng thành viên', value: group.memberCount, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 flex-1 max-w-[250px]">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members list */}
      {membersLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Đang tải danh sách thành viên...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl">
          {owners.length > 0 && (
            <div>
              <div className="px-5 py-2.5 bg-amber-50/60 border-b border-amber-100 rounded-t-2xl">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3 h-3" /> Chủ nhóm
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {owners.map(m => <MemberRow key={m.userId} member={m} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <div className={`px-5 py-2.5 bg-slate-50/60 border-y border-slate-100 ${owners.length === 0 ? 'rounded-t-2xl' : ''}`}>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Thành viên · {others.length}
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {others.map(m => <MemberRow key={m.userId} member={m} />)}
              </div>
            </div>
          )}
          {filtered.length === 0 && !membersLoading && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Không tìm thấy thành viên nào</p>
            </div>
          )}
        </div>
      )}

      {/* Join Requests (OWNER only) */}
      {isOwner && !joinRequestsLoading && joinRequests.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Yêu cầu tham gia</h3>
              <p className="text-xs text-slate-400 mt-0.5">Duyệt hoặc từ chối yêu cầu vào nhóm</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {joinRequests.length} đang chờ
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {joinRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 px-5 py-4">
                <AvatarCircle name={req.user.name} avatarUrl={req.user.avatarUrl} gradient="from-slate-400 to-slate-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{req.user.name}</p>
                  <p className="text-xs text-slate-400">{req.user.email} · {new Date(req.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    disabled={actionLoading === `accept-${req.id}` || actionLoading === `reject-${req.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border-0 cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1"
                  >
                    {actionLoading === `accept-${req.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req)}
                    disabled={actionLoading === `accept-${req.id}` || actionLoading === `reject-${req.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-all border-0 disabled:opacity-60 flex items-center gap-1"
                  >
                    {actionLoading === `reject-${req.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ——— Tab: Documents
const DocumentsTab = ({ group, isMember, canContribute, isOwner }: { group: GroupWithRole; isMember: boolean; canContribute: boolean; isOwner: boolean }) => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDocuments = useCallback(async () => {
    if (!group.id || !isMember) return;
    setLoading(true);
    try {
      const res = await getGroupDocumentsApi(group.id, {
        search: search || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      });
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [group.id, isMember, search, typeFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !group.id) return;
    
    // Check size limit (30MB)
    if (file.size > 30 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 30MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadGroupDocumentApi(group.id, file, (progress) => {
        setUploadProgress(progress);
      });
      fetchDocuments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // reset
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    try {
      await softDeleteDocumentApi(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5" />;
      case 'DOCX': return <FileIcon className="w-5 h-5" />;
      case 'PPTX': return <FilePowerpoint className="w-5 h-5" />;
      case 'XLSX': return <FileSpreadsheet className="w-5 h-5" />;
      case 'IMAGE': return <ImageIcon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-rose-50 text-rose-600';
      case 'DOCX': return 'bg-blue-50 text-blue-600';
      case 'PPTX': return 'bg-orange-50 text-orange-600';
      case 'XLSX': return 'bg-emerald-50 text-emerald-600';
      case 'IMAGE': return 'bg-purple-50 text-purple-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = async (docId: string, url: string, filename: string) => {
    try {
      const response = await downloadDocumentApi(docId);
      const blob = new Blob([response.data as any]);
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download proxy failed, using fallback", error);
      if (url.includes('/image/upload/') && filename.toLowerCase().endsWith('.pdf')) {
        alert("⚠️ CẢNH BÁO: File PDF này là dữ liệu cũ bị lưu sai định dạng. Server Cloud đã chặn quyền truy cập.\n\n👉 GIẢI PHÁP: Bạn vui lòng XÓA file này đi và TẢI LÊN LẠI file PDF đó nhé!");
        return;
      }
      const fallbackUrl = url.includes('/upload/') 
        ? url.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(filename)}/`)
        : url;
      window.open(fallbackUrl, '_blank');
    }
  };

  const handlePreview = async (e: React.MouseEvent, docId: string, url: string, type: string) => {
    e.preventDefault();
    if (type === 'PDF') {
      try {
        const response = await downloadDocumentApi(docId);
        const blob = new Blob([response.data as any], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (error) {
        console.error("Preview proxy failed, using fallback", error);
        if (url.includes('/image/upload/')) {
          alert("⚠️ CẢNH BÁO: File PDF này là dữ liệu cũ bị lưu sai định dạng. Server Cloud đã chặn quyền xem.\n\n👉 GIẢI PHÁP: Bạn vui lòng XÓA file này đi và TẢI LÊN LẠI file PDF đó nhé!");
          return;
        }
        window.open(url, '_blank');
      }
    } else if (['DOCX', 'PPTX', 'XLSX'].includes(type)) {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Tài liệu học tập</h2>
          <p className="text-xs text-slate-400 mt-0.5">Chia sẻ tài liệu, bài giảng và ghi chú với nhóm</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all"
            />
          </div>
          {canContribute && (
            <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200 whitespace-nowrap shrink-0">
              <Upload className="w-4 h-4" />
              Tải lên
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {([
          { id: 'all', label: 'Tất cả' },
          { id: 'PDF', label: 'PDF' },
          { id: 'DOCX', label: 'Word' },
          { id: 'PPTX', label: 'PowerPoint' },
          { id: 'XLSX', label: 'Excel' },
          { id: 'IMAGE', label: 'Hình ảnh' },
        ]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTypeFilter(id)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border-0 cursor-pointer ${typeFilter === id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {uploading && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-slate-700">Đang tải lên...</span>
              <span className="text-indigo-600 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Đang tải danh sách tài liệu...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Chưa có tài liệu nào</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {canContribute ? "Hãy tải lên các tài liệu hữu ích cho nhóm học tập của bạn." : "Nhóm này chưa có tài liệu nào được chia sẻ."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getFileColor(doc.type)}`}>
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDownload(doc.id, doc.url, doc.name)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer" title="Tải xuống">
                    <Download className="w-4 h-4" />
                  </button>
                  {doc.canDelete && (
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer" title="Xóa tài liệu">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <a href={doc.url} onClick={(e) => handlePreview(e, doc.id, doc.url, doc.type)} className="font-semibold text-sm text-slate-800 line-clamp-2 hover:text-indigo-600 transition-colors mb-1 text-decoration-none cursor-pointer">
                  {doc.name}
                </a>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                  <span>{formatSize(doc.size)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                <AvatarCircle name={doc.uploader?.name || 'Unknown'} avatarUrl={doc.uploader?.avatarUrl} size="sm" gradient="from-slate-400 to-slate-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-600 truncate">{doc.uploader?.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ——— Tab: Settings
const SettingsTab = ({
  group,
  onGroupUpdated,
  onGroupDeleted,
}: {
  group: GroupWithRole;
  onGroupUpdated: () => void;
  onGroupDeleted: () => void;
}) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<UpdateGroupPayload>({
    name: group.name,
    description: group.description || '',
    visibility: group.visibility,
    avatarUrl: group.avatarUrl,
    coverUrl: group.coverUrl,
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  const handleCoverClick = () => {
    if (!isUploadingCover) {
      coverFileInputRef.current?.click();
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.value ? e.target.files : null;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setCoverUploadError("Vui lòng chọn một tệp hình ảnh hợp lệ.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCoverUploadError("Kích thước ảnh không được vượt quá 10MB.");
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axiosInstance.post<{ url: string }>(
        "/upload/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data && response.data.url) {
        setForm(prev => ({ ...prev, coverUrl: response.data.url }));
      } else {
        throw new Error("Không nhận được URL ảnh từ server");
      }
    } catch (err: any) {
      console.error("Lỗi upload ảnh bìa:", err);
      setCoverUploadError(err?.response?.data?.message || err.message || "Tải ảnh bìa lên thất bại");
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateGroupApi(group.id, form);
      setSaveSuccess(true);
      onGroupUpdated();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Cập nhật thất bại, thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGroupApi(group.id);
      navigate('/groups');
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Xóa nhóm thất bại.');
      setDeleting(false);
      setShowDangerConfirm(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Thông tin nhóm */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Thông tin nhóm</h3>
          <p className="text-xs text-slate-400 mt-0.5">Cập nhật tên, mô tả và ảnh đại diện nhóm</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Cover section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">Ảnh bìa nhóm</label>
            <div className="h-32 sm:h-44 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 rounded-2xl relative overflow-hidden group">
              {form.coverUrl ? (
                <img src={form.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
              )}
              
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={handleCoverClick}
                  disabled={isUploadingCover}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  {form.coverUrl ? 'Thay đổi ảnh bìa' : 'Tải lên ảnh bìa'}
                </button>
                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={handleCoverChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingCover}
                />
              </div>

              {coverUploadError && (
                <div className="absolute bottom-2 left-2 right-2 bg-rose-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs text-center font-semibold">
                  {coverUploadError}
                </div>
              )}
            </div>
          </div>

          {/* Avatar section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">Ảnh đại diện nhóm</label>
            <div className="flex items-center gap-4">
              <AvatarUpload
                value={form.avatarUrl}
                onChange={(url) => setForm({ ...form, avatarUrl: url })}
                nameInitial={getInitials(group.name)}
                className="w-16 h-16 rounded-full border-4 border-white shadow-md ring-1 ring-slate-100"
              />
              <div>
                <p className="text-sm font-semibold text-slate-700">Đổi ảnh đại diện</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG · Tối đa 10MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Tên nhóm</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Mô tả</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả mục đích và nội dung của nhóm học..."
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-3">Quyền riêng tư</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'PUBLIC', label: 'Công khai', icon: Globe, desc: 'Ai cũng có thể xem và tham gia' },
                { value: 'INVITE', label: 'Chỉ mời', icon: UserPlus, desc: 'Cần được mời mới vào được' },
                { value: 'PRIVATE', label: 'Riêng tư', icon: Lock, desc: 'Chỉ thành viên mới thấy nội dung' },
              ] as const).map(({ value, label, icon: Icon, desc }) => (
                <button key={value} type="button" onClick={() => setForm(f => ({ ...f, visibility: value }))}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all cursor-pointer flex-1 min-w-[160px] ${form.visibility === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${form.visibility === value ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`text-xs font-bold ${form.visibility === value ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</p>
                    <p className={`text-[10px] mt-0.5 ${form.visibility === value ? 'text-indigo-500' : 'text-slate-400'}`}>{desc}</p>
                  </div>
                  {form.visibility === value && <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Đã lưu thay đổi thành công!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-rose-50">
          <h3 className="text-sm font-bold text-rose-600">Vùng nguy hiểm</h3>
          <p className="text-xs text-slate-500 mt-0.5">Hành động này không thể hoàn tác.</p>
        </div>
        <div className="p-5">
          {!showDangerConfirm ? (
            <button onClick={() => setShowDangerConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-400 rounded-xl cursor-pointer transition-all bg-transparent">
              <Trash2 className="w-4 h-4" />
              Xóa nhóm này
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Bạn có chắc chắn muốn xóa nhóm <strong className="text-slate-800">{group.name}</strong>? Tất cả dữ liệu sẽ bị xóa vĩnh viễn.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl cursor-pointer border-0 transition-all flex items-center gap-2"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
                <button onClick={() => setShowDangerConfirm(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer border-0 transition-all">
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ——— Chat Placeholder
const ChatTab = ({ group, canContribute }: { group: GroupWithRole, canContribute: boolean }) => (
  <div className="flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ minHeight: 480 }}>
    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{group.name}</p>
        <p className="text-xs text-slate-400">{group.memberCount} thành viên</p>
      </div>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6 py-16">
      {canContribute ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Chat nhóm đang được phát triển</p>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mt-1.5">
              Tính năng chat nhóm realtime sẽ sớm ra mắt. Theo dõi cập nhật nhé!
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl">
            <Bell className="w-3.5 h-3.5" />
            Sắp có mặt
          </span>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Eye className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Bạn đang ở chế độ Chỉ xem</p>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mt-1.5">
              Bạn có thể đọc tin nhắn nhưng không thể nhắn tin vào nhóm này.
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

// ——— Main Component
const GroupWorkspacePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'members';
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  // ——— Data state
  const [group, setGroup] = useState<GroupWithRole | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState('');

  const [members, setMembers] = useState<MemberData[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [joinRequests, setJoinRequests] = useState<JoinRequestData[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);

  // ——— UI state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoadingId, setInviteLoadingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState('');

  const { data: friendsList, isLoading: friendsLoading } = useFriends();

  const [leaveLoading, setLeaveLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [openJoinedDropdown, setOpenJoinedDropdown] = useState(false);
  const [openPendingDropdown, setOpenPendingDropdown] = useState(false);

  // ——— Derived
  const membershipStatus: MembershipStatus = group
    ? (group.myRole as MembershipStatus) ?? 'NOT_MEMBER'
    : 'NOT_MEMBER';

  const isOwner = membershipStatus === 'OWNER';
  const isMember = ['OWNER', 'MEMBER', 'VIEWER'].includes(membershipStatus);
  const canContribute = ['OWNER', 'MEMBER'].includes(membershipStatus);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; ownerOnly?: boolean; memberOnly?: boolean }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, memberOnly: true },
    { id: 'members', label: 'Thành viên', icon: Users },
    { id: 'documents', label: 'Tài liệu', icon: BookOpen },
    { id: 'settings', label: 'Cài đặt', icon: Settings, ownerOnly: true },
  ];

  // ——— Fetch group info
  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setGroupLoading(true);
    setGroupError('');
    try {
      const res = await getGroupInfoApi(groupId);
      setGroup(res.data?.data ?? null);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        // Group exists but user not member → still show as NOT_MEMBER
        setGroup({ id: groupId } as any);
      } else {
        setGroupError(err?.response?.data?.message || 'Không thể tải thông tin nhóm.');
      }
    } finally {
      setGroupLoading(false);
    }
  }, [groupId]);

  // ——— Fetch members
  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    setMembersLoading(true);
    try {
      const res = await getGroupMembersApi(groupId);
      setMembers(res.data?.data ?? []);
    } catch {
      // silent
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  // ——— Fetch join requests (owner only)
  const fetchJoinRequests = useCallback(async () => {
    if (!groupId || !isOwner) return;
    setJoinRequestsLoading(true);
    try {
      const res = await getJoinRequestsApi(groupId);
      const pending = (res.data?.data ?? []).filter(r => r.status === 'PENDING');
      setJoinRequests(pending);
    } catch {
      // silent
    } finally {
      setJoinRequestsLoading(false);
    }
  }, [groupId, isOwner]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);
  useEffect(() => {
    if (isMember) {
      fetchMembers();
    }
  }, [isMember, fetchMembers]);
  useEffect(() => {
    if (isOwner) fetchJoinRequests();
  }, [isOwner, fetchJoinRequests]);

  // ——— Actions
  const handleJoinGroup = async () => {
    if (!groupId) return;
    setJoinLoading(true);
    try {
      await joinRequestApi(groupId);
      await fetchGroup();
    } catch {
      // silent
    } finally {
      setJoinLoading(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (!groupId) return;
    setLeaveLoading(true);
    try {
      await leaveGroupApi(groupId);
      setShowLeaveModal(false);
      navigate('/groups');
    } catch {
      // silent
      setLeaveLoading(false);
    }
  };

  const handleSendInvite = async (userId: string) => {
    if (!groupId) return;
    setInviteLoadingId(userId);
    setInviteError('');
    try {
      await inviteMemberApi(groupId, userId);
      setInvitedIds(prev => [...prev, userId]);
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || 'Gửi lời mời thất bại.');
    } finally {
      setInviteLoadingId(null);
    }
  };

  const handleMembersChange = () => {
    fetchMembers();
    fetchGroup();
    if (isOwner) fetchJoinRequests();
  };

  // ——— Loading / Error states
  if (groupLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Đang tải thông tin nhóm...</p>
        </div>
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-rose-100 p-12 text-center max-w-sm mx-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-2">Không thể tải nhóm</h3>
          <p className="text-sm text-slate-500 mb-5">{groupError}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchGroup} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl border-0 cursor-pointer hover:bg-indigo-100 transition-all">
              <RefreshCw className="w-4 h-4" /> Thử lại
            </button>
            <button onClick={() => navigate('/groups')} className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer transition-all">
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const coverColor = getCoverColor(group.id);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ——— Cover Banner ——— */}
      <div className={`h-52 md:h-64 relative overflow-hidden bg-gradient-to-br ${coverColor}`}>
        {group.coverUrl ? (
          <img src={group.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

        {/* Back button */}
        <button
          onClick={() => navigate('/groups')}
          className="absolute top-5 left-5 md:left-8 flex items-center gap-2 px-3.5 py-2 bg-black/20 hover:bg-black/35 text-white text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Nhóm của tôi
        </button>

        {/* Visibility badge */}
        <div className="absolute top-5 right-5 md:right-8">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm text-white text-xs font-semibold rounded-xl">
            <Globe className="w-3.5 h-3.5" />
            {group.visibility === 'PUBLIC' ? 'Công khai' : group.visibility === 'PRIVATE' ? 'Riêng tư' : 'Chỉ mời'}
          </span>
        </div>
      </div>

      {/* ——— Header Info ——— */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          {/* Avatar + Info row */}
          <div className="flex flex-col sm:flex-row gap-4 relative sm:items-start">
            {/* Group Avatar */}
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${coverColor} flex items-center justify-center text-white text-4xl font-black shrink-0 border-4 border-white shadow-xl ring-2 ring-white -mt-10 sm:-mt-14 z-10 overflow-hidden`}>
              {group.avatarUrl
                ? <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                : getInitials(group.name)
              }
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0 pt-3 sm:pt-4 pb-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{group.name}</h1>
                {isOwner && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                    <Crown className="w-3 h-3" /> Chủ nhóm
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{group.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {group.memberCount} thành viên
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 sm:pt-4 sm:pb-3">
              {isMember ? (
                <>
                  {/* Mời Button */}
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    Mời
                  </button>

                  {/* Đã tham gia Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenJoinedDropdown(!openJoinedDropdown)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer transition-all"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Đã tham gia
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    {openJoinedDropdown && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpenJoinedDropdown(false)} />
                        <div className="absolute right-0 top-11 z-30 w-44 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-1.5">
                          {isOwner && (
                            <button
                              onClick={() => { setActiveTab('settings'); setOpenJoinedDropdown(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl border-0 cursor-pointer transition-all text-left"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              Cài đặt nhóm
                            </button>
                          )}
                          <button
                            onClick={() => { setOpenJoinedDropdown(false); setShowLeaveModal(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border-0 cursor-pointer transition-all text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Rời nhóm
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : membershipStatus === 'PENDING' ? (
                /* Đang chờ duyệt Dropdown */
                <div className="relative">
                  <button
                    onClick={() => setOpenPendingDropdown(!openPendingDropdown)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer transition-all"
                  >
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                    Đang chờ duyệt
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {openPendingDropdown && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenPendingDropdown(false)} />
                      <div className="absolute right-0 top-11 z-30 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-1.5">
                        <button
                          onClick={() => { setOpenPendingDropdown(false); /* cancel request */ }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border-0 cursor-pointer transition-all text-left"
                        >
                          <X className="w-3.5 h-3.5" />
                          Hủy yêu cầu tham gia
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Tham gia nhóm Button */
                <button
                  onClick={handleJoinGroup}
                  disabled={joinLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200"
                >
                  {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {joinLoading ? 'Đang gửi...' : 'Xin tham gia'}
                </button>
              )}
            </div>
          </div>

          {/* ——— Tab Navigation ——— */}
          {(isMember || group.visibility === 'PUBLIC') && (
            <div className="flex gap-0.5 border-t border-slate-100 -mx-0">
              {tabs.filter(t => (!t.ownerOnly || isOwner) && (!t.memberOnly || isMember)).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all cursor-pointer border-0 outline-none bg-transparent ${
                    activeTab === id
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {activeTab === id && (
                    <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ——— Tab Content / Lock screen ——— */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-6">
        {(!isMember && group.visibility === 'PRIVATE') ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-500">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">
                {membershipStatus === 'PENDING'
                  ? 'Yêu cầu đang chờ duyệt'
                  : 'Nhóm riêng tư'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {membershipStatus === 'PENDING'
                  ? 'Yêu cầu tham gia của bạn đã được gửi. Chờ chủ nhóm phê duyệt nhé!'
                  : 'Nội dung thảo luận học tập, tài liệu chia sẻ và danh sách thành viên được ẩn. Hãy gửi yêu cầu tham gia để cùng học tập nhé!'}
              </p>
            </div>

            {membershipStatus === 'PENDING' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 text-sm font-medium rounded-xl">
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                Đã gửi yêu cầu tham gia nhóm · Chờ phê duyệt
              </div>
            ) : (
              <button
                onClick={handleJoinGroup}
                disabled={joinLoading}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200"
              >
                {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {joinLoading ? 'Đang gửi...' : 'Xin tham gia'}
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'chat' && isMember && <ChatTab group={group} canContribute={canContribute} />}
            {activeTab === 'members' && (
              <MembersTab
                group={group}
                members={members}
                membersLoading={membersLoading}
                joinRequests={joinRequests}
                joinRequestsLoading={joinRequestsLoading}
                onMembersChange={handleMembersChange}
                onInviteClick={() => setShowInviteModal(true)}
              />
            )}
            {activeTab === 'documents' && <DocumentsTab group={group} isMember={isMember} canContribute={canContribute} isOwner={isOwner} />}
            {activeTab === 'settings' && isOwner && (
              <SettingsTab
                group={group}
                onGroupUpdated={fetchGroup}
                onGroupDeleted={() => navigate('/groups')}
              />
            )}
          </>
        )}
      </div>

      {/* Leave Group Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Rời khỏi nhóm?</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border-0 bg-transparent cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn rời khỏi nhóm <strong className="text-slate-700">{group.name}</strong>?
                Bạn sẽ không thể xem thảo luận nhóm hoặc tài liệu học tập sau khi rời nhóm.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl border-0 cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmLeave}
                  disabled={leaveLoading}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-rose-200 flex items-center gap-2"
                >
                  {leaveLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {leaveLoading ? 'Đang rời...' : 'Rời nhóm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">Mời thành viên</h3>
                <p className="text-xs text-slate-400 mt-0.5">Nhập User ID để gửi lời mời tham gia nhóm</p>
              </div>
              <button
                onClick={() => { setShowInviteModal(false); setInviteError(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border-0 bg-transparent cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {inviteError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-sm mb-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {inviteError}
                </div>
              )}
              
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {friendsLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : friendsList?.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Bạn chưa có bạn bè nào để mời.</div>
                ) : (
                  friendsList?.map(friend => {
                    const isAlreadyMember = members.some(m => m.userId === friend.id);
                    const isInvited = invitedIds.includes(friend.id);
                    const isDisabed = isAlreadyMember || isInvited;

                    return (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <AvatarCircle name={friend.name} avatarUrl={friend.avatarUrl ?? undefined} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{friend.name}</p>
                            <p className="text-xs text-slate-400">{friend.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendInvite(friend.id)}
                          disabled={isDisabed || inviteLoadingId === friend.id}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-0 transition-all cursor-pointer outline-none active:scale-95 ${
                            isAlreadyMember ? 'bg-slate-100 text-slate-400 cursor-not-allowed active:scale-100' :
                            isInvited ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed active:scale-100' :
                            'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {inviteLoadingId === friend.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                           isAlreadyMember ? 'Đã tham gia' :
                           isInvited ? 'Đã gửi lời mời' : 'Mời'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupWorkspacePage;
