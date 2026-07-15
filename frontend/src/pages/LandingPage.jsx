import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LandingPage — Minimal and professional landing page for the internal enterprise application.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 px-4 text-white">
      {/* Header / Brand */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">ED</span>
          </div>
          <span className="text-lg font-semibold tracking-wide">Expert Decision Replay</span>
        </div>
        <span className="text-xs text-surface-400 font-medium bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          Internal Enterprise System
        </span>
      </header>

      {/* Main Content Hero Area */}
      <main className="flex-1 flex items-center justify-center max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-300 border border-primary-500/20">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
            Version 1.0 Stable
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-surface-100 to-surface-300">
            Expert Decision Replay Platform
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-surface-300 leading-relaxed font-normal">
            A centralized platform for recording, reviewing, approving, and preserving organizational decisions.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-primary-500/20 transition-base text-center"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-surface-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:text-white transition-base text-center"
            >
              Register
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-white/5 text-center text-xs text-surface-400">
        <p>&copy; {new Date().getFullYear()} Expert Decision Replay Platform. All rights reserved. Authorized internal personnel access only.</p>
      </footer>
    </div>
  );
}
