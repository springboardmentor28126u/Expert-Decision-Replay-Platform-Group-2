import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      {/* Public routes (no app chrome) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App routes (wrapped in layout) */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default App;

