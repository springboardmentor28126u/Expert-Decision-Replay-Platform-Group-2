import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import CaptchaWidget from '../components/common/CaptchaWidget';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; captcha?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    if (!captchaAnswer.trim()) newErrors.captcha = 'CAPTCHA answer is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password, captcha_id: captchaId, captcha_answer: captchaAnswer.trim() });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      setErrors({ general: msg });
      // Reset CAPTCHA so user gets a fresh challenge on retry
      setCaptchaId('');
      setCaptchaAnswer('');
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Sign In</h2>
          <p className="text-sm text-text-secondary mt-1.5">
            Access the DecisionVault Platform
          </p>
        </div>

        {errors.general && (
          <div className="mb-5 rounded-lg bg-error-bg/20 border border-error/20 p-3.5 text-center text-sm text-error font-medium animate-fadeIn">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
          />

          <CaptchaWidget
            captchaId={captchaId}
            captchaAnswer={captchaAnswer}
            onChange={(id, ans) => {
              setCaptchaId(id);
              setCaptchaAnswer(ans);
              setErrors((prev) => ({ ...prev, captcha: undefined }));
            }}
            error={errors.captcha}
          />

          <Button type="submit" variant="primary" className="w-full mt-6" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-light hover:underline font-semibold transition-all">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;

