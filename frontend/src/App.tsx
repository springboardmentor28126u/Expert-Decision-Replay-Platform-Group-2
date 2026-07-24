import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { RoleGuard } from './components/dashboard/RoleGuard';
import { Toaster } from './components/ui/toaster';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboard Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Decision Pages
import DecisionList from './pages/DecisionList';
import CreateDecision from './pages/CreateDecision';
import DecisionDetail from './pages/DecisionDetail';
import EditDecision from './pages/EditDecision';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import ManagerApprovals from './pages/ManagerApprovals';
import EmployeeDiscussions from './pages/EmployeeDiscussions';

import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        </Route>

        {/* Dashboard Routes */}
        <Route
          path="/dashboard/employee"
          element={
            <RoleGuard requiredRole="Employee">
              <PageTransition><EmployeeDashboard /></PageTransition>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/manager"
          element={
            <RoleGuard requiredRole="Manager">
              <PageTransition><ManagerDashboard /></PageTransition>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <RoleGuard requiredRole="admin">
              <PageTransition><AdminDashboard /></PageTransition>
            </RoleGuard>
          }
        />
        
        {/* Profile Route (All authenticated users) */}
        <Route
          path="/profile"
          element={
            <RoleGuard>
              <PageTransition><Profile /></PageTransition>
            </RoleGuard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/dashboard/admin/users"
          element={
            <RoleGuard requiredRole="admin">
              <PageTransition><AdminUsers /></PageTransition>
            </RoleGuard>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/dashboard/manager/approvals"
          element={
            <RoleGuard requiredRole="Manager">
              <PageTransition><ManagerApprovals /></PageTransition>
            </RoleGuard>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/dashboard/employee/discussions"
          element={
            <RoleGuard requiredRole="Employee">
              <PageTransition><EmployeeDiscussions /></PageTransition>
            </RoleGuard>
          }
        />

        {/* Decision Routes */}
        <Route
          path="/decisions"
          element={
            <RoleGuard requiredRole="Employee">
              <PageTransition><DecisionList /></PageTransition>
            </RoleGuard>
          }
        />
        <Route
          path="/decisions/new"
          element={
            <RoleGuard requiredRole="Employee">
              <PageTransition><CreateDecision /></PageTransition>
            </RoleGuard>
          }
        />
        <Route
          path="/decisions/:id"
          element={
            <RoleGuard requiredRole="Employee">
              <PageTransition><DecisionDetail /></PageTransition>
            </RoleGuard>
          }
        />
        <Route
          path="/decisions/:id/edit"
          element={
            <RoleGuard requiredRole="Employee">
              <PageTransition><EditDecision /></PageTransition>
            </RoleGuard>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="edr-theme">
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

