import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';

const TEAMS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product Management' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'executive', label: 'Executive Office' },
  { value: 'operations', label: 'Operations' },
];

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'manager', label: 'Manager' },
  { value: 'administrator', label: 'Administrator' },
];

/**
 * RegisterPage — Standalone registration page connected to backend.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    team: '',
    role: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    const fieldName = id.replace('register-', '');
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear validation error on change
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.team) {
      newErrors.team = 'Please select your department team';
    }

    if (!formData.role) {
      newErrors.role = 'Please select your organization role';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setSubmitError('');
    setSuccessMessage('');

    // Prepare payload matching FastAPI schema (excludes confirmPassword)
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      team: formData.team,
      role: formData.role,
    };

    const result = await register(payload);

    if (result.success) {
      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      setSubmitError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 px-4 py-12">
      {/* Glass card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-lg">ED</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-surface-300">
            Join the Decision Replay Platform
          </p>
        </div>

        {/* Global Error Banner */}
        {submitError && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center font-medium">
            {submitError}
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm text-center font-medium animate-pulse">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            id="register-name"
            label="Full name"
            type="text"
            variant="dark"
            autoComplete="name"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            disabled={loading}
          />

          <Input
            id="register-email"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="register-team"
              label="Team Department"
              variant="dark"
              placeholder="Select team"
              options={TEAMS}
              value={formData.team}
              onChange={handleChange}
              error={errors.team}
              disabled={loading}
            />

            <Select
              id="register-role"
              label="System Role"
              variant="dark"
              placeholder="Select role"
              options={ROLES}
              value={formData.role}
              onChange={handleChange}
              error={errors.role}
              disabled={loading}
            />
          </div>

          <Input
            id="register-password"
            label="Password"
            type="password"
            variant="dark"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={loading}
          />

          <Input
            id="register-confirmPassword"
            label="Confirm password"
            type="password"
            variant="dark"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-surface-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
