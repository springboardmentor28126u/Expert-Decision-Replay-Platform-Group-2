import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { RoleCard } from '../components/auth/RoleCard';
import { StepIndicator } from '../components/auth/StepIndicator';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { IconAlertCircle, IconArrowLeft, IconUser, IconSearch, IconUsers, IconMail, IconShield } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const registerSchema = z.object({
  full_name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain a number' }),
  confirm_password: z.string(),
  role: z.enum(['employee', 'reviewer', 'manager', 'admin']).optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterRole = 'employee' | 'reviewer' | 'manager' | 'admin';

const roles: { id: RegisterRole; label: string; icon: typeof IconUser; description: string }[] = [
  { id: 'employee', label: 'Employee', icon: IconUser, description: 'Create and track decisions' },
  { id: 'reviewer', label: 'Reviewer', icon: IconSearch, description: 'Review and provide feedback on assigned decisions' },
  { id: 'manager', label: 'Manager', icon: IconUsers, description: 'Manage teams, approvals, and organizational decisions' },
  { id: 'admin', label: 'Admin', icon: IconShield, description: 'Manage users, roles, decisions, and platform settings' },
];

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
  const { register: registerUser, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<RegisterRole | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await registerUser({ ...data, role: selectedRole });
      setStep(2);
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">EDR Platform</h1>
      </div>

      <Card className="shadow-lg border-primary/20 backdrop-blur-sm bg-card/90">
        <CardHeader className="space-y-4">
          <StepIndicator steps={['Select Role', 'Account Details', 'Verification']} currentStep={step} />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              {step === 0
                ? 'Choose your role'
                : step === 1
                  ? 'Create your account'
                  : 'Check your email'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 0
                ? 'Select the role that best describes your position'
                : step === 1
                  ? 'Enter your details to get started'
                  : "We've sent a verification link to your email address"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {authError && step !== 2 && (
            <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2">
              <IconAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
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
                    onClick={() => {
                      setSelectedRole(role.id);
                      setStep(1);
                    }}
                  />
                ))}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      autoFocus
                      {...register('full_name')}
                      className={errors.full_name ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...register('email')}
                      className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    <PasswordStrength password={passwordValue} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      {...register('confirm_password')}
                      className={errors.confirm_password ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.confirm_password && (
                      <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconArrowLeft size={14} />
                  Back to role selection
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconMail size={32} className="text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try registering again.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link to="/login">Go to Sign In</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {step !== 2 && (
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Register;
