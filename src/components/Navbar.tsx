// src/components/Navbar.tsx
import React, { useState } from 'react';
import {
  Shield,
  Bell,
  RefreshCw,
  Plus,
  Radio,
  Search,
  CheckCircle2,
  ChevronDown,
  Layers,
  Smartphone,
  Bot,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { Target, Notification, User } from '../types';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  targets: Target[];
  selectedTargetId: string;
  onSelectTarget: (id: string) => void;
  onOpenAddTarget: () => void;
  onResetDemo: () => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigate: (view: string) => void;
  user?: User;
  isScanningActive?: boolean;
  onOpenLogin?: () => void;
  onOpenMobileInstall?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  targets,
  selectedTargetId,
  onSelectTarget,
  onOpenAddTarget,
  onResetDemo,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
  user,
  isScanningActive = false,
  onOpenLogin,
  onOpenMobileInstall,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTargetSelect, setShowTargetSelect] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const handleReset = async () => {
    setIsResetting(true);
    await onResetDemo();
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-400">
                SENTINELSCOPE
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                ASM v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 tracking-tight">Attack Surface Reconnaissance</p>
          </div>
        </div>

        {/* Global Live Scanning Indicator */}
        {isScanningActive && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>PIPELINE WORKERS ACTIVE</span>
          </div>
        )}
      </div>

      {/* Target Domain Scope Switcher */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowTargetSelect(!showTargetSelect)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-200 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Active Scope</div>
              <div className="font-mono font-semibold text-slate-100">
                {selectedTarget ? selectedTarget.domain : 'All Scopes'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </button>

          {showTargetSelect && (
            <div className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-2 animate-in fade-in">
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Authorized Targets ({targets.length})
              </div>
              <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    onSelectTarget('');
                    setShowTargetSelect(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    selectedTargetId === '' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono">All Target Domains</span>
                  {selectedTargetId === '' && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                </button>

                {targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTarget(t.id);
                      setShowTargetSelect(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      selectedTargetId === t.id ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-left font-mono">
                      <div>{t.domain}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{t.subdomainCount || 0} subdomains</div>
                    </div>
                    {selectedTargetId === t.id && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowTargetSelect(false);
                    onOpenAddTarget();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Authorized Target
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Target Quick Button */}
        <button
          onClick={onOpenAddTarget}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Target
        </button>

        {/* AVI Copilot Button */}
        <button
          onClick={() => onNavigate('avi-terminal')}
          title="Open AVI Security AI Terminal"
          className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 font-mono text-xs font-semibold shadow-sm shadow-cyan-500/10 cursor-pointer"
        >
          <Bot className="h-4 w-4 text-cyan-400" />
          <span className="hidden md:inline text-[11px]">AVI Copilot</span>
        </button>

        {/* Mobile Shortcut / Install Button */}
        {onOpenMobileInstall && (
          <button
            onClick={onOpenMobileInstall}
            title="Download / Add Mobile App Shortcut to Phone"
            className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
          >
            <Smartphone className="h-4 w-4 text-cyan-400" />
            <span className="hidden xl:inline text-[11px] font-mono font-semibold text-slate-300">App Shortcut</span>
          </button>
        )}

        {/* Admin Governance Quick Link */}
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => onNavigate('admin-panel')}
            title="Administrator Governance & User Audit Panel"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-300 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Admin Panel</span>
          </button>
        )}

        {/* Demo Data Reset Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset environment to default Acme Corp dataset"
          className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                {unreadNotifications}
              </span>
            )}
          </button>

          <NotificationCenter
            notifications={notifications}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
            onNavigate={onNavigate}
          />
        </div>

        {/* User / Admin Session Badge */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <button
            onClick={onOpenLogin}
            title="View Session details"
            className="flex items-center gap-2.5 hover:bg-slate-900/80 p-1.5 rounded-xl transition-all text-left cursor-pointer group"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 flex items-center justify-center font-bold text-xs text-slate-950 shadow">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors leading-tight">
                {user ? user.name : 'User'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono leading-none">
                {user?.role === 'ADMIN' ? 'ADMIN (AUTHORIZED)' : user ? user.role : 'ANALYST'}
              </div>
            </div>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out Session"
              className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
