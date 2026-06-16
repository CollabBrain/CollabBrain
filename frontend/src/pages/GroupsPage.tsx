import { useState } from 'react';

import {
  Search,
  Bell,
  HelpCircle,
  Plus,
  Compass,
  LayoutGrid,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserPlus2,
  Lock,
  FileText,
} from 'lucide-react';
import { useProfile } from '../features/profile/hooks/useProfile';

/**
 * GroupsPage — Bảng điều khiển nhóm học tập Studifier (Mockup 4).
 * Giao diện đa cột cao cấp:
 * - Cột trái: Điều hướng Nhóm và nhóm đã Ghim.
 * - Cột giữa: Feed hoạt động gần đây của các nhóm (Hóa hữu cơ, Bảo mật).
 * - Cột phải: Các buổi học sắp diễn ra và gợi ý tham gia nhóm mới.
 * - Nút FloatingActionButton "+" tạo nhóm nhanh ở góc phải dưới.
 */
const GroupsPage = () => {
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'all' | 'joined' | 'popular' | 'events'>('all');
  const [navSelected, setNavSelected] = useState<'groups' | 'discover' | 'create'>('groups');

  const userAvatar = profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
  const userName = profile?.name || 'Alex River';

  return (
    <div className="space-y-6 font-sans animate-fade-in text-slate-800">
      
      {/* Top Search & Profile Utilities Bar Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between shadow-[0_4px_24px_rgba(99,102,241,0.01)] select-none">
        {/* Search Input bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Studifier..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200/10 focus:bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-semibold placeholder:text-slate-400"
          />
        </div>

        {/* Quick controls icons */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border-0 bg-transparent cursor-pointer">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border-0 bg-transparent cursor-pointer">
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-100 mx-1" />

          <div className="flex items-center gap-2">
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Responsive Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ——— Left Column (12 cols on mobile, 3 cols on desktop) ——— */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card 1: Groups Navigation */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left select-none">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">
              Groups Navigation
            </h3>
            <div className="space-y-1">
              {[
                { id: 'groups', label: 'Your Groups', icon: LayoutGrid },
                { id: 'discover', label: 'Discover', icon: Compass },
                { id: 'create', label: 'Create Group', icon: Plus },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setNavSelected(id as any)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all border-0 outline-none cursor-pointer',
                    navSelected === id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Pinned Groups */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left select-none">
            <div className="flex items-center justify-between mb-4 pl-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pinned Groups
              </h3>
              <button className="text-[11px] font-bold text-indigo-600 hover:underline border-0 bg-transparent cursor-pointer">
                Edit
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'Quantum Mechanics',
                  tag: 'Q',
                  color: 'bg-blue-50 text-blue-600 border-blue-100/50',
                  badge: 12,
                },
                {
                  name: 'Med School Prep',
                  tag: 'M',
                  color: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
                  badge: 3,
                },
                {
                  name: 'Data Science 101',
                  tag: 'D',
                  color: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
                  sub: 'Active now',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50/70 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl shrink-0 border flex items-center justify-center font-bold text-xs ${item.color}`}>
                      {item.tag}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </p>
                      {item.sub && (
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5 animate-pulse">
                          {item.sub}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ——— Middle Column (Main Study Feed - 6 cols on desktop) ——— */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Feed Tag Filters */}
          <div className="flex gap-2 select-none border-b border-slate-100 pb-2">
            {[
              { id: 'all', label: 'All Activity' },
              { id: 'joined', label: 'Joined' },
              { id: 'popular', label: 'Popular' },
              { id: 'events', label: 'New Events' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={[
                  'px-4 py-2 text-xs font-extrabold rounded-full transition-all border-0 cursor-pointer active:scale-95 outline-none',
                  activeTab === id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                    : 'bg-white border border-slate-200/50 text-slate-400 hover:bg-slate-50 hover:text-slate-600',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Group Post 1: Organic Chemistry */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(99,102,241,0.02)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.04)] hover:border-slate-200/50 transition-all duration-300">
            {/* Header banner background color/image mock */}
            <div className="bg-gradient-to-r from-teal-500/80 to-indigo-600/90 px-6 py-8 text-white relative select-none">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start z-10 relative">
                <div className="space-y-1.5 text-left">
                  <h4 className="text-lg font-black tracking-tight leading-tight">Organic Chemistry Lab</h4>
                  <p className="text-xs text-slate-200/90 font-medium">2,450 members &bull; 12 online</p>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-bold bg-white/20 border border-white/20 rounded-full tracking-wider">
                  MEMBER
                </span>
              </div>
            </div>

            {/* Post feed body */}
            <div className="p-6 text-left space-y-4">
              <div className="flex gap-3">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                  alt="Alex Johnson"
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 shadow-sm"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">
                    <span className="font-extrabold text-slate-800 hover:text-indigo-600 cursor-pointer">Alex Johnson</span> shared a new document:
                  </p>
                  <p className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                    Ch7_Isomers_Notes.pdf
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">2 hours ago</p>
                </div>
              </div>

              {/* Bottom members join info & Action button */}
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between select-none">
                {/* Micro avatar overlap stack */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[
                      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
                    ].map((avatar, index) => (
                      <img
                        key={index}
                        src={avatar}
                        alt="Member"
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">+8 others</span>
                </div>

                <button className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer border-0 outline-none active:scale-95">
                  Enter Group
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Group Post 2: Ethical Hacking */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(99,102,241,0.02)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.04)] hover:border-slate-200/50 transition-all duration-300">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-950 px-6 py-8 text-white relative select-none">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start z-10 relative">
                <div className="space-y-1.5 text-left">
                  <h4 className="text-lg font-black tracking-tight leading-tight">Ethical Hacking & Security</h4>
                  <p className="text-xs text-slate-300 font-medium">12,800 members &bull; 45 online</p>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-bold bg-white/10 border border-white/10 rounded-full tracking-wider text-slate-300">
                  DISCOVER
                </span>
              </div>
            </div>

            <div className="p-6 text-left space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 shrink-0 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 leading-snug">
                    <span className="font-extrabold text-slate-800">Group Admin</span> announced a live study session:
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                    Introduction to Penetration Testing
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold animate-pulse">
                    Starting in 15 minutes
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between select-none">
                <span className="text-[10px] font-extrabold text-slate-400">Joined by 4 of your friends</span>
                
                <button className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer border-0 outline-none active:scale-95">
                  Join Session
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ——— Right Column (Sessions & Recommendations - 3 cols on desktop) ——— */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card 1: Upcoming Sessions */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left select-none relative">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Upcoming Sessions
              </h3>
            </div>

            <div className="space-y-4">
              {[
                {
                  status: 'LIVE NOW',
                  title: 'Advanced Algorithms Review',
                  time: 'Ends at 3:00 PM',
                  accent: 'border-l-indigo-600',
                  badgeColor: 'text-indigo-600 bg-indigo-50 animate-pulse',
                },
                {
                  status: 'IN 2 HOURS',
                  title: 'French Conversation Circle',
                  time: '4:30 PM - 5:30 PM',
                  accent: 'border-l-violet-500',
                  badgeColor: 'text-violet-600 bg-violet-50',
                },
              ].map((event, idx) => (
                <div
                  key={idx}
                  className={`pl-3 border-l-2 ${event.accent} py-0.5 space-y-1 relative`}
                >
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${event.badgeColor}`}>
                    {event.status}
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-snug group hover:text-indigo-600 cursor-pointer">
                    {event.title}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">{event.time}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 text-center">
              <button className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline border-0 bg-transparent cursor-pointer">
                View All Events
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Suggested For You */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_24px_rgba(99,102,241,0.01)] text-left select-none">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 pl-1">
              Suggested For You
            </h3>

            <div className="space-y-3">
              {[
                { name: 'Machine Learning', members: '8.2k members' },
                { name: 'Philosophy Circle', members: '1.5k members' },
                { name: 'UI Design Lab', members: '3.1k members' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50/70 transition-all cursor-pointer group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-700 truncate group-hover:text-indigo-600">
                      {item.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400">{item.members}</p>
                  </div>
                  
                  <button className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-slate-100 hover:border-indigo-600 rounded-xl transition-all cursor-pointer bg-transparent outline-none">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Micro Footer links */}
          <div className="text-[10px] font-bold text-slate-400 text-center space-y-1 select-none">
            <div className="space-x-1.5">
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span>&bull;</span>
              <span className="hover:underline cursor-pointer">Terms</span>
              <span>&bull;</span>
              <span className="hover:underline cursor-pointer">Cookies</span>
            </div>
            <p>Studifier &copy; 2024</p>
          </div>

        </div>

      </div>

      {/* Blue Floating Action Button "+" in the bottom right corner */}
      <button
        title="Create Group"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-600/30 scale-100 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 z-40 outline-none"
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
};

export default GroupsPage;
