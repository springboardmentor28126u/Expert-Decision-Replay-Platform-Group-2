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
import { IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const { login, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState<"employee" | "admin">("employee");
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const dashboardPath = await login({ ...data, login_context: loginMode });
      navigate(dashboardPath);
    } catch (err) {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="flex justify-center mb-8 md:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-primary">EDR Platform</h1>
      </div>
      <Card className="shadow-2xl border-primary/20 backdrop-blur-xl bg-card/80 border-t-white/10 dark:border-t-white/5">
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access the platform
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-lg bg-muted">
            <Button
              type="button"
              variant={loginMode === "employee" ? "default" : "ghost"}
              onClick={() => setLoginMode("employee")}
              className="w-full"
            >
              Employee Login
            </Button>
            <Button
              type="button"
              variant={loginMode === "admin" ? "default" : "ghost"}
              onClick={() => setLoginMode("admin")}
              className="w-full"
            >
              Admin Login
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {authError && (
            <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2">
              <IconAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
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
                {...register("password")}
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
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
    </motion.div>
  );
};

export default Login;
