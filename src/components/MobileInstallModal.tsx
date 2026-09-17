// src/components/MobileInstallModal.tsx
// Modal guide for adding SentinelScope to phone home screen / shortcut

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  Check,
  ExternalLink,
  Shield,
  Zap,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with App Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center">
            <img src="/icon.svg" alt="SentinelScope App Icon" className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              SENTINELSCOPE PWA
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Mobile Shortcut
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Install high-res shortcut icon on iOS, Android, or ChromeOS
            </p>
          </div>
        </div>

        {/* 1-Click Install Button if supported */}
        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            1-CLICK INSTALL TO HOME SCREEN
          </button>
        )}

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            How to Add to Phone Home Screen:
          </div>

          <div className="space-y-2.5 pt-1 text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                1
              </span>
              <div>
                <strong>iPhone (Safari):</strong> Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-cyan-400" />, scroll down and tap <strong className="text-cyan-300">"Add to Home Screen"</strong>.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                2
              </span>
              <div>
                <strong>Android (Chrome):</strong> Tap the <strong>Three Dots (⋮)</strong> menu in the top right, then tap <strong className="text-cyan-300">"Install app"</strong> or <strong className="text-cyan-300">"Add to Home screen"</strong>.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                3
              </span>
              <div>
                <strong>Icon & Splash:</strong> The app shortcut will launch full-screen with the custom high-resolution SentinelScope cyber-shield icon and admin session state.
              </div>
            </div>
          </div>
        </div>

        {/* Copy App Link Action */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopyAppUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'App URL Copied!' : 'Copy App URL to Send to Mobile'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
