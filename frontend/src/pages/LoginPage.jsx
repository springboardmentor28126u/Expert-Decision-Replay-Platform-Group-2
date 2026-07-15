import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

/**
 * LoginPage — Standalone authentication page.
 */
export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id.replace('login-', '')]: value }));
    // Clear validation error on change
    if (errors[id.replace('login-', '')]) {
      setErrors((prev) => ({ ...prev, [id.replace('login-', '')]: '' }));
    }
  };

  const handleSubmit = (e) => {
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

    console.log('Logging in with:', formData);
    // Integration logic goes here later
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 px-4">
      {/* Glass card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-lg">ED</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-surface-300">
            Sign in to Decision Replay Platform
          </p>
        </div>

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
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5"
          >
            Sign in
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
