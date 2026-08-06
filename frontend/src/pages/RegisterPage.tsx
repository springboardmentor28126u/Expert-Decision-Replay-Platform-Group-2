import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { USER_ROLES } from '../utils/constants';
import { extractErrorMessage } from '../utils/error';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Registration failed. Please check details and try again.');
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center p-6 bg-surface relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/5 blur-[100px] pointer-events-none select-none" />

      <Card className="w-full max-w-md p-8 relative z-10 animate-scaleIn shadow-2xl bg-surface-elevated/40 border border-border/80">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4 select-none">
            <div className="h-5 w-5 rounded bg-primary shadow-sm" />
            <span className="text-sm font-bold text-text tracking-tight uppercase">
              Decision Vault
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Create Account</h2>
          <p className="text-sm text-text-secondary mt-1.5">
            Register to join the DecisionVault Platform
          </p>
        </div>

        {errors.general && (
          <div className="mb-5 rounded-lg bg-error-bg/25 border border-error/20 p-3.5 text-center text-sm text-error font-medium animate-fadeIn">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors({});
            }}
            error={errors.username}
            placeholder="john_doe"
            required
            autoComplete="username"
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
            error={errors.email}
            placeholder="name@organization.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({});
            }}
            error={errors.password}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
              Assign Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field cursor-pointer"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-6" loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-light hover:underline font-semibold transition-all">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
