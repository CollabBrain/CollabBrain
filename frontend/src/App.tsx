import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { FriendsPage } from './pages/FriendsPage';
import { FriendRequestsPage } from './pages/FriendRequestsPage';
import { SuggestionsPage } from './pages/SuggestionsPage';
import { BlockedListPage } from './pages/BlockedListPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { Users, UserPlus, ShieldOff, Lightbulb, Bell } from 'lucide-react';

const navLinks = [
  { to: '/friends', label: 'Bạn bè', icon: Users },
  { to: '/friends/requests', label: 'Lời mời', icon: UserPlus },
  { to: '/friends/suggestions', label: 'Gợi ý', icon: Lightbulb },
  { to: '/friends/blocked', label: 'Đã chặn', icon: ShieldOff },
];

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
          {/* Brand */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">CollabBrain</h1>
                <p className="text-xs text-slate-400 font-medium">Mạng xã hội</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                      <Icon size={16} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">© 2025 CollabBrain Team</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top bar */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-end sticky top-0 z-10 shadow-sm">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
          </header>

          <div className="p-6 md:p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/friends" replace />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/friends/requests" element={<FriendRequestsPage />} />
              <Route path="/friends/suggestions" element={<SuggestionsPage />} />
              <Route path="/friends/blocked" element={<BlockedListPage />} />
              <Route path="/users/:id" element={<UserProfilePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
