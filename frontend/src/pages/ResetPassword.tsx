import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain a lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain a number" }),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // If no token in URL, show an error
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">EDR Platform</h1>
        </div>
        <Card className="shadow-lg border-primary/20 backdrop-blur-sm bg-card/90">
          <CardContent className="pt-6">
            <div className="p-4 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2">
              <IconAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Invalid reset link. Please request a new password reset.</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline text-sm">
              Request new reset link
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.resetPassword(token, data.new_password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">EDR Platform</h1>
      </div>
      <Card className="shadow-lg border-primary/20 backdrop-blur-sm bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-center">Set new password</CardTitle>
          <CardDescription className="text-center">
            {success
              ? "Your password has been reset"
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2">
              <IconAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm flex items-start gap-2">
                <IconCircleCheck size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Password reset successful! Redirecting to login...
                </span>
              </div>
              <Button asChild className="w-full">
                <Link to="/login">Sign in now</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...register("new_password")}
                  className={errors.new_password ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...register("confirm_password")}
                  className={errors.confirm_password ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
                    <span>Resetting...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
