import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const AuthLayout = ({ children }: { children?: ReactNode }) => {
  const { isAuthenticated, isLoading, getDashboardPath } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If already authenticated, redirect to role-based dashboard
  if (isAuthenticated) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Left side - Animated Background/Branding */}
      <div className="hidden md:flex md:w-1/2 relative bg-primary/5 overflow-hidden border-r border-border/50 items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-0"></div>
        
        {/* Animated decorative blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Expert Decision Replay Platform
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Streamline your organizational decision-making process. Evaluate alternatives, gather approvals, and track outcomes with total clarity.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 z-10 relative bg-background/50 backdrop-blur-xl">
        <div className="w-full max-w-md">
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  );
};
