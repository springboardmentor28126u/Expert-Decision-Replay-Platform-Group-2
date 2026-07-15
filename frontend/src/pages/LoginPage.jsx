import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';

/**
 * LoginPage — Standalone authentication page connected to backend.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id.replace('login-', '')]: value }));
    // Clear validation error on change
    if (errors[id.replace('login-', '')]) {
      setErrors((prev) => ({ ...prev, [id.replace('login-', '')]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setSubmitError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      const userRole = result.user.role;
      // Redirect based on user role
      if (userRole === 'employee') {
        navigate('/employee/dashboard');
      } else if (userRole === 'reviewer') {
        navigate('/reviewer/dashboard');
      } else if (userRole === 'manager') {
        navigate('/manager/dashboard');
      } else if (userRole === 'administrator') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setSubmitError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 px-4">
      {/* Glass card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-lg">ED</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-surface-300">
            Sign in to Decision Replay Platform
          </p>
        </div>

        {/* Global Error Banner */}
        {submitError && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center font-medium">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            id="login-email"
            label="Email address"
            type="email"
            variant="dark"
            autoComplete="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={loading}
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            variant="dark"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-surface-300">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
