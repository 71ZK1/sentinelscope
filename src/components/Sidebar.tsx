// src/components/Sidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  Target as TargetIcon,
  Server,
  AlertOctagon,
  Network,
  History,
  GitBranch,
  FileCheck,
  BookOpen,
  Terminal,
  Shield,
  Zap,
  Globe,
  Layers,
  Lock,
  Bot,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  openFindingsCount?: number;
  activeScansCount?: number;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  openFindingsCount = 0,
  activeScansCount = 0,
  userRole,
}) => {
  const navItems = [
    ...(userRole === 'ADMIN'
      ? [
          {
            id: 'admin-panel',
            label: 'Admin & User Logs',
            icon: ShieldAlert,
            badge: 'Lead',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
          },
        ]
      : []),
    {
      id: 'dashboard',
      label: 'Security Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'targets',
      label: 'Authorized Scopes',
      icon: TargetIcon,
      badge: null,
    },
    {
      id: 'assets',
      label: 'Asset Inventory',
      icon: Server,
      badge: null,
    },
    {
      id: 'endpoints',
      label: 'APIs & Parameters',
      icon: Globe,
      badge: 'Discovery',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'traffic',
      label: 'HTTP Traffic & Logs',
      icon: Layers,
      badge: null,
    },
    {
      id: 'repeater',
      label: 'HTTP Repeater & Probe',
      icon: Terminal,
      badge: 'Burp Tool',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'intruder',
      label: 'HTTP Intruder & Fuzz',
      icon: Zap,
      badge: 'Brute-Force',
      badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
    },
    {
      id: 'crypto-stego',
      label: 'Crypto & Stego Lab',
      icon: Lock,
      badge: 'Crypto',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'avi-terminal',
      label: 'AVI Security AI',
      icon: Bot,
      badge: 'AI Copilot',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse',
    },
    {
      id: 'findings',
      label: 'Security Findings',
      icon: AlertOctagon,
      badge: openFindingsCount > 0 ? `${openFindingsCount}` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'graph',
      label: 'Attack Surface Graph',
      icon: Network,
      badge: 'Visual',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    },
    {
      id: 'scans',
      label: 'Recon Pipeline & Logs',
      icon: History,
      badge: activeScansCount > 0 ? `${activeScansCount} running` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 animate-pulse',
    },
    {
      id: 'changes',
      label: 'Surface Drift & History',
      icon: GitBranch,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Executive Reports',
      icon: FileCheck,
      badge: null,
    },
    {
      id: 'education',
      label: 'Recon Knowledge Base',
      icon: BookOpen,
      badge: 'Docs',
      badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950/60 p-4 justify-between">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Platform Reconnaissance
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security Assessment Policy Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Shield className="h-4 w-4 shrink-0" />
            <span>Authorized Scope</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Non-destructive reconnaissance only. Destructive exploitation and password attacks are prohibited.
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Rate Limit: Enforced</span>
          </div>
        </div>
      </div>

      {/* System Footer Info */}
      <div className="pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Engine: Go-Node Scanner</span>
          <span className="text-cyan-500/80">ONLINE</span>
        </div>
      </div>
    </aside>
  );
};
