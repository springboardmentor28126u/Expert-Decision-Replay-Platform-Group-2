import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-surface text-text font-sans relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-primary/5 via-accent/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* 1. Sticky Navbar */}
      <nav className="sticky top-0 z-50 w-full h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-6 w-6 rounded-md bg-primary shadow-lg shadow-primary/20" />
            <span className="text-lg font-bold tracking-tight text-text">DecisionVault</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-text-secondary hover:text-text transition-all cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-text-secondary hover:text-text transition-all cursor-pointer">
              How It Works
            </button>
            <button onClick={() => scrollToSection('benefits')} className="text-sm font-medium text-text-secondary hover:text-text transition-all cursor-pointer">
              Benefits
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-text-secondary hover:text-text transition-all">
                Login
              </Link>
              <Button variant="primary" size="sm" onClick={handleGetStarted}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="max-w-7xl mx-auto px-8 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-4rem)]">
        <div className="lg:col-span-6 space-y-6 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary-light uppercase tracking-wider">
            Expert Decision Replay Platform
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.1] select-none">
            Capture Every Decision. <span className="gradient-text">Understand Every Outcome.</span>
          </h1>
          
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
            Capture, analyze, collaborate, and preserve organizational decisions with structured workflows, discussion threads, version history, and knowledge replay.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button variant="primary" onClick={handleGetStarted} className="px-8 shadow-lg shadow-primary/25">
              Get Started
            </Button>
            <Button variant="secondary" onClick={() => scrollToSection('features')} className="px-8">
              Explore Platform
            </Button>
          </div>
        </div>

        {/* Right side: CSS Animated Enterprise Dashboard Illustration */}
        <div className="lg:col-span-6 relative flex justify-center items-center h-[450px] lg:h-[500px] w-full animate-fadeIn select-none pointer-events-none">
          {/* Subtle surrounding glow */}
          <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl -z-10" />

          {/* Root Card Mock */}
          <div className="w-[90%] md:w-[80%] lg:w-[95%] aspect-video bg-surface-elevated border border-border/80 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col p-4 animate-pulse-glow">
            {/* Header Mock */}
            <div className="flex justify-between items-center border-b border-border/50 pb-3 mb-4">
              <div className="flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-error" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                <div className="h-4 w-28 bg-border/80 rounded ml-2" />
              </div>
              <div className="h-5 w-16 bg-primary/20 border border-primary/30 rounded-full" />
            </div>

            {/* Split layout inside mockup */}
            <div className="flex flex-1 gap-4 overflow-hidden">
              {/* Left Mock list */}
              <div className="w-1/3 flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-2 border border-border/40 rounded-lg bg-surface/30 space-y-1">
                    <div className="h-3 w-4/5 bg-border rounded" />
                    <div className="h-2 w-1/2 bg-border/40 rounded" />
                  </div>
                ))}
              </div>

              {/* Right Mock panel details */}
              <div className="flex-1 border border-border/40 rounded-xl bg-surface/20 p-3 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-2/3 bg-border rounded" />
                  <div className="h-3 w-10 bg-success/20 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full bg-border/40 rounded" />
                  <div className="h-2.5 w-5/6 bg-border/40 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-10 border border-border/40 rounded-md bg-surface-hover/30 p-2 flex flex-col justify-between">
                    <div className="h-2 w-1/3 bg-border/50 rounded" />
                    <div className="h-3 w-2/3 bg-success rounded-sm" />
                  </div>
                  <div className="h-10 border border-border/40 rounded-md bg-surface-hover/30 p-2 flex flex-col justify-between">
                    <div className="h-2 w-1/3 bg-border/50 rounded" />
                    <div className="h-3 w-1/2 bg-primary rounded-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Moving visual nodes representing tracking flow */}
            <div className="absolute bottom-6 right-6 flex items-center gap-1.5 bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-[9px] font-bold text-primary-light animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-ping" />
              Recording Version History
            </div>
          </div>
        </div>
      </header>

      {/* 3. Trusted Features Badge Grid */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-16 border-y border-border/60 bg-surface-elevated/10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted text-center mb-8">
          Enterprise Grade Core Features
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            'Decision Management',
            'Alternative Analysis',
            'Discussion Threads',
            'Version History',
            'Knowledge Repository',
            'Role-Based Access',
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-5 border border-border/40 rounded-xl bg-surface-elevated/40 text-center hover:border-primary/40 hover:bg-surface-hover/30 transition-all group"
            >
              <div className="h-2.5 w-2.5 rounded-full bg-primary mb-3.5 group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold text-text-secondary group-hover:text-text transition-colors">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. How It Works Timeline */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-8 py-24 space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-text">How It Works</h2>
          <p className="text-sm text-text-secondary max-w-lg mx-auto">
            A simple, structured workflow to capture decisions without breaking your team's velocity.
          </p>
        </div>

        {/* Timeline Path */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 max-w-5xl mx-auto">
          {/* Horizontal Line connector for desktop */}
          <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[1px] bg-border -z-10" />

          {[
            {
              step: 'Step 1',
              title: 'Create Decision',
              desc: 'Log the problem statement, primary context, and select the category fields.',
            },
            {
              step: 'Step 2',
              title: 'Compare Alternatives',
              desc: 'Evaluate solutions using scores for impact, cost, risk, and feasibility.',
            },
            {
              step: 'Step 3',
              title: 'Collaborate',
              desc: 'Engage stakeholders via threaded comment chains, meeting logs, and file inputs.',
            },
            {
              step: 'Step 4',
              title: 'Replay Past Decisions',
              desc: 'Audit chronological changes to reconstruct the precise reasoning.',
            },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4 px-4 group">
              <div className="h-14 w-14 rounded-full border border-border bg-surface-elevated flex items-center justify-center font-bold text-sm text-primary-light shadow-md group-hover:border-primary/60 group-hover:bg-primary/5 transition-all">
                {idx + 1}
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {item.step}
                </span>
                <h4 className="text-base font-bold text-text group-hover:text-primary-light transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Platform Benefits Grid */}
      <section id="benefits" className="max-w-7xl mx-auto px-8 py-20 border-t border-border/40 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-text">Built for Modern Teams</h2>
          <p className="text-sm text-text-secondary">
            Keep your engineering, product, and leadership operations completely aligned.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Eliminate Alignment Gaps',
              desc: 'Keep everyone in lockstep. Stop repeating past discussions and align stakeholders through real-time threaded records.',
            },
            {
              title: 'Chronological Audit History',
              desc: 'Understand exactly how plans evolved. Track who modified details, when states transitioned, and why directions shifted.',
            },
            {
              title: 'Structured Metric Matrix',
              desc: 'Avoid gut-feeling decisions. Grade alternatives based on impact, cost, risk, and feasibility indicators.',
            },
            {
              title: 'Central Repository',
              desc: 'Onboard new hires seamlessly. Replay historical decisions in a single database to learn the context of your codebase.',
            },
            {
              title: 'Pluggable Architecture',
              desc: 'Seamless file uploading backed by clean design wrappers, enabling easy migration to S3 when scaling up.',
            },
            {
              title: 'Role-Based Compliance',
              desc: 'Enforce team governance with permission settings for Employees, Reviewers, Managers, and Admins.',
            },
          ].map((benefit, i) => (
            <Card key={i} className="border border-border/60 bg-surface-elevated/10 hover:border-primary/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light font-extrabold text-xs">
                  {i + 1}
                </div>
                <h4 className="text-base font-bold text-text">{benefit.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. Final CTA Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="rounded-2xl border border-border bg-gradient-to-b from-surface-elevated/80 to-surface-elevated/40 p-8 md:p-16 text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle radial glow overlay */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[80px] pointer-events-none -z-10" />

          <h2 className="text-3xl md:text-4xl font-extrabold text-text tracking-tight">
            Start Recording Better Decisions Today
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            Record, evaluate, and build a lasting knowledge repository for your engineering and operational frameworks.
          </p>
          <div className="pt-2">
            <button
              onClick={handleGetStarted}
              className="h-11 px-8 rounded-md bg-white text-zinc-950 font-bold hover:bg-zinc-200 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md select-none cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-text-muted bg-surface-elevated/10">
        <p>© {new Date().getFullYear()} DecisionVault. All rights reserved. Built for engineering teams.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
