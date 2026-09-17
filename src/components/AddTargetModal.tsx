// src/components/AddTargetModal.tsx
import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Globe, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { Target, Scan, User } from '../types';
import { api } from '../lib/api';

interface AddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTargetAdded: (target: Target, scan: Scan) => void;
  currentUser?: User | null;
}

export const AddTargetModal: React.FC<AddTargetModalProps> = ({
  isOpen,
  onClose,
  onTargetAdded,
  currentUser,
}) => {
  const [domain, setDomain] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [tagsInput, setTagsInput] = useState('Primary Scope, Production');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultAuthorizer = currentUser?.name || currentUser?.email || 'Security Analyst';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!domain.trim()) {
      setError('Please enter a target domain name.');
      return;
    }

    if (!isConfirmed) {
      setError('You must confirm authorized testing permission before continuing.');
      return;
    }

    setLoading(true);

    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

      const data = await api.addTarget({
        domain: cleanDomain,
        authorizedBy: authorizedBy.trim() || defaultAuthorizer,
        isConfirmed,
        tags,
        notes: notes.trim(),
      });

      onTargetAdded(data.target, data.scan);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add target domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Add Authorized Target</h3>
                <p className="text-xs text-slate-400">Define domain scope for passive and safe active reconnaissance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Domain <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. example.com or app.myorg.io"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Enter the apex domain or wildcard root to discover subdomains, live hosts, and open ports.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Authorized By / Stakeholder
              </label>
              <input
                type="text"
                placeholder={currentUser?.name ? `Default: ${currentUser.name}` : 'e.g. Authorized Stakeholder Name'}
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Leave blank to automatically default to your user name ({defaultAuthorizer}).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Scope Tags (Comma separated)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Production, Cloud, AWS"
                    className="w-full pl-9 rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Assessment Rate Limit
                </label>
                <input
                  type="text"
                  disabled
                  value="60 requests / min (Safe Standard)"
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assessment Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific boundary conditions, excluded third-party SaaS vendors, or escalation contacts..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700/80 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Strict Scope Confirmation Checkbox */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <div className="flex items-start gap-3">
                <input
                  id="scopeConfirmation"
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
                />
                <label htmlFor="scopeConfirmation" className="text-xs text-slate-200 cursor-pointer select-none">
                  <span className="font-semibold text-cyan-300">Authorization Verification (Required):</span>
                  <br />
                  "I confirm that I own this target domain or have explicit, documented authorization to test its attack surface under safe, non-destructive assessment parameters."
                </label>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isConfirmed}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Initializing Scan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Authorize & Add Target
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
