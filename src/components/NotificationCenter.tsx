// src/components/NotificationCenter.tsx
import React, { useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, Info, Check, CheckCheck, ExternalLink, X } from 'lucide-react';
import { Notification } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate?: (link: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when touching or clicking anywhere outside the notification center
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: Notification['type'], sev?: string) => {
    if (sev === 'CRITICAL') return <ShieldAlert className="h-4 w-4 text-red-400" />;
    if (sev === 'HIGH') return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    return <Info className="h-4 w-4 text-cyan-400" />;
  };

  return (
    <>
      {/* Full-screen backdrop to detect any click/tap outside */}
      <div
        className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
        onClick={onClose}
        onTouchStart={onClose}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              title="Close notifications"
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No system notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-800/40 ${
                  !n.isRead ? 'bg-slate-850/70 border-l-2 border-cyan-500' : 'opacity-75'
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                  {getIcon(n.type, n.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{n.title}</h4>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{n.message}</p>

                  <div className="mt-2 flex items-center justify-between">
                    {n.link ? (
                      <button
                        onClick={() => {
                          onMarkRead(n.id);
                          if (onNavigate) onNavigate(n.link!);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400 hover:underline cursor-pointer"
                      >
                        View Details <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    ) : <div />}

                    {!n.isRead && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
