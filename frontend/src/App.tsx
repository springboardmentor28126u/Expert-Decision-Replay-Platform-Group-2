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

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="edr-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Dashboard Routes */}
            <Route
              path="/dashboard/employee"
              element={
                <RoleGuard requiredRole="Employee">
                  <EmployeeDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/dashboard/manager"
              element={
                <RoleGuard requiredRole="Manager">
                  <ManagerDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <RoleGuard requiredRole="Administrator">
                  <AdminDashboard />
                </RoleGuard>
              }
            />

            {/* Decision Routes */}
            <Route
              path="/decisions"
              element={
                <RoleGuard requiredRole="Employee">
                  <DecisionList />
                </RoleGuard>
              }
            />
            <Route
              path="/decisions/new"
              element={
                <RoleGuard requiredRole="Employee">
                  <CreateDecision />
                </RoleGuard>
              }
            />
            <Route
              path="/decisions/:id"
              element={
                <RoleGuard requiredRole="Employee">
                  <DecisionDetail />
                </RoleGuard>
              }
            />
            <Route
              path="/decisions/:id/edit"
              element={
                <RoleGuard requiredRole="Employee">
                  <EditDecision />
                </RoleGuard>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

