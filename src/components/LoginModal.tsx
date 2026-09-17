// src/components/LoginModal.tsx
import React, { useState } from 'react';
import { Shield, Lock, User, Key, CheckCircle2, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType, token: string, redirect?: string) => void;
  currentUser?: UserType;
  onLogout?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      setSuccessMsg(`Welcome back, ${res.user.name}! Session authenticated.`);
      setTimeout(() => {
        onLoginSuccess(res.user, res.token, res.redirect);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <ShieldCheck className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {currentUser ? 'Session Details' : 'Security Authentication'}
              </h3>
              <p className="text-[11px] text-slate-400">SentinelScope Enterprise Access Gate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-base border border-cyan-500/40">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">{currentUser.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {currentUser.email || 'Authorized User'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Account Role:</span>
                <span className="text-cyan-400 font-semibold">{currentUser.role === 'ADMIN' ? 'Administrator' : currentUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Repeater:</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recon Engine:</span>
                <span className="text-emerald-400 font-semibold">Connected</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors"
                >
                  Sign Out
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Username field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-cyan-400" />
                <span>Email or Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your email or username"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 font-mono focus:outline-none transition-colors"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-cyan-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 font-mono focus:outline-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>Authenticate</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
