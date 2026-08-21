import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { motion } from 'framer-motion';
import { IconLogin, IconUserPlus, IconShield, IconUsers, IconBrain, IconChartBar } from '@tabler/icons-react';

const features = [
  { icon: IconBrain, title: 'Track Decisions', desc: 'Create, manage, and replay organizational decisions with full audit trails.' },
  { icon: IconShield, title: 'Secure Approvals', desc: 'Role-based approval chains with digital signatures and attestation.' },
  { icon: IconUsers, title: 'Team Collaboration', desc: 'Work in groups, request to join teams, and collaborate on decisions.' },
  { icon: IconChartBar, title: 'Benchmark Performance', desc: 'Compare your decisions against category benchmarks and trends.' },
];

export const Welcome = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 overflow-hidden border-r border-border/50 items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-0" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <div className="relative z-10 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Expert Decision Replay Platform
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Streamline your organizational decision-making process. Evaluate alternatives, gather approvals, and track outcomes with total clarity.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="p-3 rounded-lg bg-background/60 backdrop-blur border border-border/50">
                  <f.icon size={20} className="text-primary mb-2" />
                  <h3 className="text-sm font-medium">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — CTA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile-only title */}
          <div className="flex justify-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold tracking-tight text-primary">EDR Platform</h1>
          </div>

          <Card className="shadow-2xl border-primary/20 backdrop-blur-xl bg-card/80">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Welcome</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to your account or create a new one to get started.
                </p>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full h-12 text-base" size="lg">
                  <Link to="/login">
                    <IconLogin size={18} />
                    Sign In
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full h-12 text-base" size="lg">
                  <Link to="/register">
                    <IconUserPlus size={18} />
                    Create Account
                  </Link>
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to the platform's terms of service and privacy policy.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
