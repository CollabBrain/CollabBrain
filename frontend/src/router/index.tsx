import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAuthStore, useHasHydrated } from '../store/useAuthStore';
import { useAdminAuthStore, useHasAdminHydrated } from '../store/useAdminAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const DocumentsPage = lazy(() => import('../pages/DocumentsPage'));
const GroupsPage = lazy(() => import('../pages/GroupsPage'));
const GroupWorkspacePage = lazy(() => import('../pages/GroupWorkspacePage'));
const TodoListPage = lazy(() => import('../pages/TodoListPage'));
const DocsPage = lazy(() => import('../pages/DocsPage'));

// Lazy load friend pages (from feature/friend-ui)
const FriendsPage = lazy(() => import('../pages/FriendsPage'));
const FriendRequestsPage = lazy(() => import('../pages/FriendRequestsPage').then(module => ({ default: module.FriendRequestsPage })));
const SuggestionsPage = lazy(() => import('../pages/SuggestionsPage').then(module => ({ default: module.SuggestionsPage })));
const BlockedListPage = lazy(() => import('../pages/BlockedListPage').then(module => ({ default: module.BlockedListPage })));
const UserProfilePage = lazy(() => import('../pages/UserProfilePage').then(module => ({ default: module.UserProfilePage })));

// Lazy load flashcard pages
const DecksPage = lazy(() => import('../features/flashcard/pages/DecksPage').then(module => ({ default: module.DecksPage })));
const DeckDetailPage = lazy(() => import('../features/flashcard/pages/DeckDetailPage').then(module => ({ default: module.DeckDetailPage })));

// Lazy load admin pages
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'));
const AdminStatsPage = lazy(() => import('../pages/admin/AdminStatsPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminGroupsPage = lazy(() => import('../pages/admin/AdminGroupsPage'));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminDocumentsPage = lazy(() => import('../pages/admin/AdminDocumentsPage'));

// Spinner toàn màn hình khi đang lazy-load hoặc đợi hydration
const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50/30">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

// Route bảo vệ — đợi hydration xong mới check auth
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useHasHydrated();

  // Chưa hydrate xong → hiện spinner, KHÔNG redirect
  if (!hasHydrated) return <PageSpinner />;

  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
};

// Route chỉ dành cho khách (chưa đăng nhập) — đợi hydration xong
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useHasHydrated();

  // Chưa hydrate xong → hiện spinner, KHÔNG redirect
  if (!hasHydrated) return <PageSpinner />;

  return !isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.DASHBOARD} replace />;
};

// Route bảo vệ Admin — đợi hydration xong mới check auth
const AdminPrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useHasAdminHydrated();

  if (!hasHydrated) return <PageSpinner />;

  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

// Route chỉ dành cho khách Admin (chưa đăng nhập) — đợi hydration xong
const AdminGuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useHasAdminHydrated();

  if (!hasHydrated) return <PageSpinner />;

  return !isAuthenticated ? <>{children}</> : <Navigate to="/admin/dashboard" replace />;
};

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* ——— Client Auth routes (khách, chưa đăng nhập) */}
        <Route
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>

        {/* ——— Client Protected routes (cần đăng nhập) */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.DOCUMENTS} element={<DocumentsPage />} />
          <Route path={ROUTES.GROUPS} element={<GroupsPage />} />
           <Route path="/groups/:groupId" element={<GroupWorkspacePage />} />
          <Route path="/todos" element={<TodoListPage />} />

          {/* ——— Friend routes (from feature/friend-ui) */}
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/requests" element={<FriendRequestsPage />} />
          <Route path="/friends/suggestions" element={<SuggestionsPage />} />
          <Route path="/friends/blocked" element={<BlockedListPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />

          {/* ——— Flashcard routes */}
          <Route path="/flashcard" element={<DecksPage />} />
          <Route path="/flashcard/decks/:deckId" element={<DeckDetailPage />} />
        </Route>

        {/* ——— Admin Guest routes */}
        <Route
          element={
            <AdminGuestRoute>
              <Outlet />
            </AdminGuestRoute>
          }
        >
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* ——— Admin Protected routes */}
        <Route
          element={
            <AdminPrivateRoute>
              <AdminLayout />
            </AdminPrivateRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminStatsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/groups" element={<AdminGroupsPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        {/* ——— Public Landing Page */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        
        {/* ——— Public Docs Page */}
        <Route path={ROUTES.DOCS} element={<DocsPage />} />

        {/* ——— 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
