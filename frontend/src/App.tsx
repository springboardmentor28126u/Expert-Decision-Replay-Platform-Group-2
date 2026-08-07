import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient();

// Layout & Common
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Eagerly loaded core pages for instant dashboard render
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Lazy loaded sub-pages (Code Splitting for fast initial bundle download)
const DecisionsPage = lazy(() => import('./pages/DecisionsPage'));
const DecisionDetailPage = lazy(() => import('./pages/DecisionDetailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PendingApprovalsPage = lazy(() => import('./pages/PendingApprovalsPage'));
const ApprovedDecisionsPage = lazy(() => import('./pages/ApprovedDecisionsPage'));
const ReplaysPage = lazy(() => import('./pages/ReplaysPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

const PageFallback: React.FC = () => (
  <div className="p-8 space-y-4 animate-pulse">
    <div className="h-8 w-48 bg-surface-hover/80 rounded" />
    <div className="h-64 w-full bg-surface-hover/40 rounded-xl" />
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Landing Route */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Application Routes under /dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="decisions" element={<DecisionsPage />} />
                <Route path="decisions/:id" element={<DecisionDetailPage />} />
                <Route path="pending-approvals" element={<PendingApprovalsPage />} />
                <Route path="approved" element={<ApprovedDecisionsPage />} />
                <Route path="replays" element={<ReplaysPage />} />
                <Route path="analytics/:type" element={<AnalyticsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* Admin Only Route */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute roles={['Administrator']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback Catch All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
    </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
