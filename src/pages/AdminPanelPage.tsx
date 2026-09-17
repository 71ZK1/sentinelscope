// src/pages/AdminPanelPage.tsx
// Dedicated Administrator Governance, Security Audit Logs & Brute-Force Shield

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Activity,
  Search,
  RefreshCw,
  Clock,
  Globe,
  CheckCircle2,
  XCircle,
  UserPlus,
  LogIn,
  LogOut,
  Download,
  Filter,
  ShieldCheck,
  Laptop,
  Trash2,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  Check,
  AlertOctagon,
  Play,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../lib/api';
import { User, UserAuditLog } from '../types';

interface AdminPanelPageProps {
  currentUser?: User | null;
}

interface PerimeterData {
  status: string;
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  activeLockouts: Array<{ target: string; type: 'IP' | 'ACCOUNT'; remainingSeconds: number; failureCount: number }>;
  totalTrackedEntities: number;
  protectionFeatures: string[];
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'shield'>('logs');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [perimeterData, setPerimeterData] = useState<PerimeterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, logsRes, perimeterRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminAuditLogs(),
        api.getSecurityPerimeterStatus().catch(() => null),
      ]);
      setUsers(usersRes.users || []);
      setAuditLogs(logsRes.logs || []);
      if (perimeterRes) {
        setPerimeterData(perimeterRes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin governance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.targetDomain && log.targetDomain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!searchQuery) return true;
      return (
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [users, searchQuery]);

  // Metrics
  const totalUsers = users.length;
  const totalLogins = auditLogs.filter((l) => l.action === 'LOGIN_SUCCESS').length;
  const failedAttempts = auditLogs.filter((l) => l.action === 'LOGIN_FAILURE').length;
  const totalRegistrations = auditLogs.filter((l) => l.action === 'REGISTRATION').length;

  // Single Log Delete Action
  const handleDeleteLog = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteAuditLog(id);
      setAuditLogs((prev) => prev.filter((l) => l.id !== id));
      showToast('Audit log entry permanently deleted');
    } catch (err: any) {
      alert(err.message || 'Failed to delete audit log entry');
    } finally {
      setDeletingId(null);
    }
  };

  // Clear All Logs Action
  const handleClearAllLogs = async () => {
    setIsClearing(true);
    try {
      await api.clearAllAuditLogs();
      setAuditLogs([]);
      setShowClearConfirm(false);
      showToast('All audit logs have been purged successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to clear audit logs');
    } finally {
      setIsClearing(false);
    }
  };

  // Lift Lock on an IP or Account
  const handleUnlockTarget = async (target: string) => {
    try {
      await api.unlockSecurityPerimeter(target);
      showToast(`Lock lifted for ${target}`);
      const updated = await api.getSecurityPerimeterStatus();
      setPerimeterData(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to unlock target');
    }
  };

  // Export JSON
  const exportJsonLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `sentinelscope_audit_logs_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON log export generated');
  };

  // Export PDF with jspdf & jspdf-autotable
  const exportPdfLogs = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor = [15, 23, 42]; // slate-900
      const accentCyan = [6, 182, 212]; // cyan-500

      // Document Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 26, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('SENTINELSCOPE - ACCESS & SECURITY AUDIT REPORT', 14, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Classification: AUTHORIZED INTERNAL AUDIT | Records: ${filteredLogs.length}`,
        14,
        20
      );

      // Summary KPI strip
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Total Accounts: ${totalUsers}   |   Successful Logins: ${totalLogins}   |   Failed / Blocked: ${failedAttempts}   |   Registrations: ${totalRegistrations}`,
        14,
        32
      );

      const tableColumn = [
        'Timestamp',
        'User Name',
        'Account Email',
        'IP Address',
        'Target Scope',
        'Event Action',
        'Status',
        'Event Details',
      ];

      const tableRows = filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.userName,
        log.userEmail || '—',
        log.ipAddress,
        log.targetDomain || '—',
        log.action,
        log.status,
        log.details || '—',
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          font: 'helvetica',
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [30, 41, 59], // slate-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 32 },
          2: { cellWidth: 46 },
          3: { cellWidth: 28 },
          4: { cellWidth: 32 },
          5: { cellWidth: 22 },
          6: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => {
          // Footer
          const pageStr = `Page ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'SentinelScope Security Perimeter - Tamper-Resistant Audit Log System',
            14,
            doc.internal.pageSize.height - 8
          );
          doc.text(
            pageStr,
            doc.internal.pageSize.width - 25,
            doc.internal.pageSize.height - 8
          );
        },
      });

      doc.save(
        `sentinelscope_audit_logs_${new Date().toISOString().slice(0, 10)}.pdf`
      );
      showToast('PDF audit report generated successfully');
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('Could not export PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-mono">Purge All Audit Logs?</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">This irreversible action wipes all records.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono leading-relaxed">
              All {auditLogs.length} audit trail records (logins, IP signatures, registrations) will be permanently cleared from the database store.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-mono text-slate-300 hover:text-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllLogs}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isClearing ? 'Clearing...' : 'Confirm Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-100 font-mono">
                ADMINISTRATION & SECURITY AUDIT PANEL
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                AUTHORIZED LEAD
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Active identity governance, registered accounts, client IP tracking, brute-force perimeter, and audit export.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-mono text-slate-300 hover:text-slate-100 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={exportPdfLogs}
            disabled={isExportingPdf || filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>

          <button
            onClick={exportJsonLogs}
            disabled={filteredLogs.length === 0}
            className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-400 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>

          {auditLogs.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-xs font-mono text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Logs
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Registered Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">{totalUsers}</div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-1">
            <UserPlus className="w-3 h-3 text-emerald-400" />
            <span>{totalRegistrations} new self-signups</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Successful Logins</span>
            <LogIn className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{totalLogins}</div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">Authenticated sessions</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Failed / Blocked</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-2">{failedAttempts}</div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">Brute-force security blocks</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Total Audit Events</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-2">{auditLogs.length}</div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {perimeterData?.activeLockouts?.length ? `${perimeterData.activeLockouts.length} active lockouts` : 'Perimeter shield active'}
          </div>
        </div>
      </div>

      {/* Main Tabs and Content */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              User Access & IP Logs ({auditLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Registered Accounts ({users.length})
            </button>

            <button
              onClick={() => setActiveTab('shield')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'shield'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Brute-Force Shield {perimeterData?.activeLockouts?.length ? `(${perimeterData.activeLockouts.length} Locked)` : ''}
            </button>
          </div>

          {/* Search and Filters */}
          {activeTab !== 'shield' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === 'logs' ? 'Search user, email, IP, target scope...' : 'Search users...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              {activeTab === 'logs' && (
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Events</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="LOGIN_FAILURE">Login Failure</option>
                  <option value="REGISTRATION">Registration</option>
                  <option value="TARGET_CREATE">Scope Added</option>
                  <option value="TARGET_DELETE">Scope Removed</option>
                  <option value="SCAN_INITIATE">Scan Launched</option>
                  <option value="LOGOUT">Logout</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Access & Audit Logs */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            {error && (
              <div className="p-4 m-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-mono text-red-300">
                {error}
              </div>
            )}

            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">User Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Target Scope</th>
                  <th className="py-3 px-4 font-semibold">Action / Event</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                      {loading ? 'Loading audit records...' : 'No matching audit events found.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                          {log.userName}
                        </td>

                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {log.userEmail || <span className="text-slate-600">—</span>}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-[11px]">
                            <Globe className="w-3 h-3 text-cyan-500 shrink-0" />
                            {log.ipAddress}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.targetDomain ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-medium">
                              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                              {log.targetDomain}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.action === 'LOGIN_SUCCESS' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <LogIn className="w-3 h-3" />
                              LOGIN
                            </span>
                          )}
                          {log.action === 'LOGIN_FAILURE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              FAILED ATTEMPT
                            </span>
                          )}
                          {log.action === 'REGISTRATION' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-fit">
                              <UserPlus className="w-3 h-3" />
                              SIGN UP
                            </span>
                          )}
                          {log.action === 'TARGET_CREATE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 w-fit">
                              <Globe className="w-3 h-3" />
                              SCOPE ADDED
                            </span>
                          )}
                          {log.action === 'TARGET_DELETE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Trash2 className="w-3 h-3" />
                              SCOPE REMOVED
                            </span>
                          )}
                          {log.action === 'SCAN_INITIATE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1 w-fit">
                              <Play className="w-3 h-3" />
                              SCAN LAUNCHED
                            </span>
                          )}
                          {log.action === 'LOGOUT' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-fit">
                              <LogOut className="w-3 h-3" />
                              LOGOUT
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-semibold">
                              <XCircle className="w-3 h-3" />
                              DENIED
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {log.details || <span className="text-slate-600">—</span>}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deletingId === log.id}
                            title="Delete this audit record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Registered Accounts */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Created At</th>
                  <th className="py-3 px-4 font-semibold">Last Login</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                      No registered users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isAdmin = user.role === 'ADMIN';
                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isAdmin
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {user.email}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isAdmin ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                              ADMIN (LEAD)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              {user.role}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString()
                            : <span className="text-slate-600">Never</span>}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Brute-Force Shield & Active Lockouts */}
        {activeTab === 'shield' && (
          <div className="p-6 space-y-6">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Perimeter Status</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-2">ACTIVE PROTECTION</div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">Dual IP & Account threshold enforcement</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Lockout Rules</span>
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-2">5 Tries / 15-Min Lock</div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">Progressive throttling + delays injected</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Active Lockouts</span>
                  <Flame className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-lg font-bold font-mono text-red-400 mt-2">
                  {perimeterData?.activeLockouts?.length || 0} Blocked
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">Automated lockdown triggers</div>
              </div>
            </div>

            {/* Active Lockouts Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                Current Security Restrictions & Lockouts
              </h3>

              {!perimeterData?.activeLockouts || perimeterData.activeLockouts.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center font-mono">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs text-slate-300 font-semibold">No active lockout restrictions</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your site is protected. If an attacker attempts more than 5 failed logins, they are automatically quarantined for 15 minutes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Target Entity</th>
                        <th className="py-2.5 px-4 font-semibold">Lock Type</th>
                        <th className="py-2.5 px-4 font-semibold">Failed Attempts</th>
                        <th className="py-2.5 px-4 font-semibold">Remaining Cooldown</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {perimeterData.activeLockouts.map((lockout) => (
                        <tr key={lockout.target} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-semibold text-red-300">{lockout.target}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                              {lockout.type} LOCK
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">{lockout.failureCount}</td>
                          <td className="py-2.5 px-4 text-cyan-400">{lockout.remainingSeconds}s</td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => handleUnlockTarget(lockout.target)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 hover:border-slate-600 transition cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Unlock className="w-3 h-3 text-emerald-400" />
                              Lift Lock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Architecture Protection Mechanisms */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
                Active Brute-Force Mitigations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    Dual-Layer Lockout Enforcement
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    Locks out both the client IP address and the targeted account username/email after 5 failed attempts to stop distributed attacks.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    Progressive Artificial Throttling Delays
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    Injects scaling artificial delay (600ms to 2000ms) on repeated failures to exhaust automated dictionary and fuzzing engines.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    Anti-Flooding Registration Perimeter
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    Restricts account creation frequency per IP subnet to prevent bot scripts from overwhelming the user database.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    Zero-Credential Leaks & Bcrypt 12 Hashing
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    Passwords are salted with bcrypt at cost 12. Failed attempts return constant-time generic responses to prevent user enumeration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
