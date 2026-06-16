import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAuthStore, useHasHydrated } from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const DocumentsPage = lazy(() => import('../pages/DocumentsPage'));
const GroupsPage = lazy(() => import('../pages/GroupsPage'));

// Lazy load friend pages (from feature/friend-ui)
const FriendsPage = lazy(() => import('../pages/FriendsPage'));
const FriendRequestsPage = lazy(() => import('../pages/FriendRequestsPage').then(module => ({ default: module.FriendRequestsPage })));
const SuggestionsPage = lazy(() => import('../pages/SuggestionsPage').then(module => ({ default: module.SuggestionsPage })));
const BlockedListPage = lazy(() => import('../pages/BlockedListPage').then(module => ({ default: module.BlockedListPage })));
const UserProfilePage = lazy(() => import('../pages/UserProfilePage').then(module => ({ default: module.UserProfilePage })));

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

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* ——— Auth routes (khách, chưa đăng nhập) */}
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

        {/* ——— Protected routes (cần đăng nhập) */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.DOCUMENTS} element={<DocumentsPage />} />
          <Route path={ROUTES.GROUPS} element={<GroupsPage />} />

          {/* ——— Friend routes (from feature/friend-ui) */}
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/requests" element={<FriendRequestsPage />} />
          <Route path="/friends/suggestions" element={<SuggestionsPage />} />
          <Route path="/friends/blocked" element={<BlockedListPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Route>

        {/* ——— Public Landing Page */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        {/* ——— 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
