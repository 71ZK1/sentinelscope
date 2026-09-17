// src/pages/LoginPage.tsx
// SentinelScope Authentication & Registration Portal

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Key,
  Mail,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserType, token: string, redirect?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Fields
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.login(identifier.trim(), password);
      const isLeadAdmin = res.user.role === 'ADMIN';
      setSuccess(
        isLeadAdmin
          ? `Admin Authorization Confirmed. Routing to Administrator Panel...`
          : `Authentication Confirmed. Welcome back, ${res.user.name}!`
      );
      setTimeout(() => {
        onLoginSuccess(res.user, res.token, res.redirect || (isLeadAdmin ? 'admin-panel' : 'dashboard'));
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register(regEmail.trim(), name.trim(), regPassword);
      setSuccess(`Account registered successfully! Welcome to SentinelScope, ${res.user.name}.`);
      setTimeout(() => {
        onLoginSuccess(res.user, res.token, res.redirect || 'dashboard');
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Glow & Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/80 to-[#020617] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Center Auth Card */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-xl shadow-cyan-500/25 mx-auto">
            <img src="/icon.svg" alt="SentinelScope Logo" className="w-14 h-14 rounded-2xl" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 font-mono flex items-center justify-center gap-2">
              SENTINELSCOPE
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                v2.4
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Attack Surface Management & Threat Reconnaissance
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Security Access Notice */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Database Engine:</span>
            <span className="text-cyan-400 font-semibold">Bcrypt Hashing Active</span>
          </div>
          <span className="text-slate-500 text-[10px]">Secure</span>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="font-mono">{error}</div>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="font-mono font-semibold">{success}</div>
          </div>
        )}

        {/* Form: Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or username"
                  autoComplete="username"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Encrypted Session</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                TLS 1.3 / AES Protected
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form: Sign Up (Registration) */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                autoComplete="name"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Email Address
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. security-analyst@enterprise.com"
                autoComplete="email"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Create Password (min. 6 characters)
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose a strong password"
                autoComplete="new-password"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your account will be saved to the database for future logins.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[10px] font-mono text-slate-400">
            {mode === 'signin' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-cyan-400 hover:underline cursor-pointer font-semibold"
                >
                  Create one here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-cyan-400 hover:underline cursor-pointer font-semibold"
                >
                  Sign in here
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
