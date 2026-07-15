import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
 * RegisterPage — Standalone registration page.
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    team: '',
    role: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { id, value } = e.target;
    const fieldName = id.replace('register-', '');
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear validation error on change
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleSubmit = (e) => {
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

    console.log('Registering with:', formData);
    // Integration logic goes here later
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 px-4 py-12">
      {/* Glass card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-lg">ED</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-surface-300">
            Join the Decision Replay Platform
          </p>
        </div>

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
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5"
          >
            Create account
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
