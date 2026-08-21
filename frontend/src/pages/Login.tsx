import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { RoleCard } from '../components/auth/RoleCard';
import { StepIndicator } from '../components/auth/StepIndicator';
import { IconAlertCircle, IconArrowLeft, IconUser, IconSearch, IconUsers, IconShield } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginRole = 'employee' | 'reviewer' | 'manager' | 'admin';

const roles: { id: LoginRole; label: string; icon: typeof IconUser; description: string }[] = [
  { id: 'employee', label: 'Employee', icon: IconUser, description: 'Create and track decisions' },
  { id: 'reviewer', label: 'Reviewer', icon: IconSearch, description: 'Review assigned decisions' },
  { id: 'manager', label: 'Manager', icon: IconUsers, description: 'Manage teams and decisions' },
  { id: 'admin', label: 'Admin', icon: IconShield, description: 'Platform administration' },
];

export const Login = () => {
  const { login, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      const dashboardPath = await login({ ...data, login_context: selectedRole });
      navigate(dashboardPath);
    } catch {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelect = (role: LoginRole) => {
    setSelectedRole(role);
    setStep(1);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-8 md:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-primary">EDR Platform</h1>
      </div>

      <Card className="shadow-2xl border-primary/20 backdrop-blur-xl bg-card/80">
        <CardHeader className="space-y-4">
          <StepIndicator steps={['Select Role', 'Credentials']} currentStep={step} />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              {step === 0 ? 'Choose your role' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 0
                ? 'Select the role you want to use'
                : `Signing in as ${selectedRole}`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {authError && (
            <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2 whitespace-pre-wrap">
              <IconAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {authError.includes('[ Change Role ]') ? (
                  <>
                    <span>{authError.replace('[ Change Role ]', '').trim()}</span>
                    <button
                      type="button"
                      onClick={() => { setStep(0); setSelectedRole(null); }}
                      className="mt-3 w-full py-1.5 px-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IconArrowLeft size={14} />
                      Change Role
                    </button>
                  </>
                ) : (
                  <span>{authError}</span>
                )}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {roles.map((role) => (
                  <RoleCard
                    key={role.id}
                    icon={<role.icon size={20} />}
                    title={role.label}
                    description={role.description}
                    selected={selectedRole === role.id}
                    onClick={() => handleRoleSelect(role.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      autoFocus
                      {...register('email')}
                      className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => { setStep(0); setSelectedRole(null); }}
                  className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconArrowLeft size={14} />
                  Back to role selection
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
