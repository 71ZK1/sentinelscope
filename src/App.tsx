// src/App.tsx
// SentinelScope Attack Surface Management & Threat Reconnaissance Platform

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import {
  Target,
  Scan,
  Asset,
  Finding,
  DashboardStats,
  AttackSurfaceGraphData,
  HistoricalChange,
  Notification,
  User,
} from './types';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AddTargetModal } from './components/AddTargetModal';
import { StartScanModal } from './components/StartScanModal';
import { LoginModal } from './components/LoginModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TargetsPage } from './pages/TargetsPage';
import { AssetsPage } from './pages/AssetsPage';
import { FindingsPage } from './pages/FindingsPage';
import { GraphPage } from './pages/GraphPage';
import { ScansPage } from './pages/ScansPage';
import { ChangesPage } from './pages/ChangesPage';
import { ReportsPage } from './pages/ReportsPage';
import { EducationPage } from './pages/EducationPage';
import { RepeaterPage } from './pages/RepeaterPage';
import { IntruderPage } from './pages/IntruderPage';
import { EndpointsPage } from './pages/EndpointsPage';
import { TrafficPage } from './pages/TrafficPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { CryptoStegoPage } from './pages/CryptoStegoPage';
import { AviTerminalPage } from './pages/AviTerminalPage';
import { AviFloatingTerminal } from './components/AviFloatingTerminal';
import { MobileInstallModal } from './components/MobileInstallModal';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>();
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [isAviFloatingOpen, setIsAviFloatingOpen] = useState<boolean>(false);

  // Cross-tool request dispatchers
  const [repeaterDraft, setRepeaterDraft] = useState<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  } | undefined>();

  const [intruderDraft, setIntruderDraft] = useState<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  } | undefined>();

  // Data State
  const [targets, setTargets] = useState<Target[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [graphData, setGraphData] = useState<AttackSurfaceGraphData | null>(null);
  const [changes, setChanges] = useState<HistoricalChange[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Active Scanning Worker State
  const [activeScan, setActiveScan] = useState<Scan | null>(null);

  // Modals
  const [isAddTargetModalOpen, setIsAddTargetModalOpen] = useState(false);
  const [scanModalTarget, setScanModalTarget] = useState<Target | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: 'info' | 'success' | 'alert' } | null>(null);

  const showToast = (title: string, desc?: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Verify stored session token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('sentinelscope_token');
      if (!savedToken) {
        setIsAuthChecking(false);
        setUser(undefined);
        return;
      }
      try {
        const res = await api.getMe();
        if (res?.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem('sentinelscope_token');
          setUser(undefined);
        }
      } catch {
        localStorage.removeItem('sentinelscope_token');
        setUser(undefined);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch all core platform state
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [
        targetsRes,
        statsRes,
        assetsRes,
        findingsRes,
        scansRes,
        graphRes,
        changesRes,
        notifsRes,
      ] = await Promise.allSettled([
        api.getTargets(),
        api.getStats(selectedTargetId || undefined),
        api.getAssets(selectedTargetId || undefined),
        api.getFindings({ targetId: selectedTargetId || undefined }),
        api.getScans(selectedTargetId || undefined),
        api.getGraph(selectedTargetId || undefined),
        api.getChanges(selectedTargetId || undefined),
        api.getNotifications(),
      ]);

      if (targetsRes.status === 'fulfilled') setTargets(targetsRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
      if (findingsRes.status === 'fulfilled') setFindings(findingsRes.value);
      if (scansRes.status === 'fulfilled') {
        const scansData = scansRes.value;
        setScans(scansData);
        // Check if any scan is running
        const running = scansData.find((s) => s.status === 'RUNNING' || s.status === 'QUEUED');
        if (running) {
          setActiveScan(running);
        } else if (activeScan && activeScan.status === 'RUNNING') {
          const updated = scansData.find((s) => s.id === activeScan.id);
          if (updated) setActiveScan(updated);
        }
      }
      if (graphRes.status === 'fulfilled') setGraphData(graphRes.value);
      if (changesRes.status === 'fulfilled') setChanges(changesRes.value);
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value);
    } catch (err) {
      console.error('[SentinelScope] Failed to load data:', err);
    }
  }, [user, selectedTargetId, activeScan?.id]);

  // Initial load & scope change load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedTargetId]);

  // Live polling for running scans
  useEffect(() => {
    const hasRunning = scans.some((s) => s.status === 'RUNNING' || s.status === 'QUEUED') || (activeScan && activeScan.status === 'RUNNING');
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const [scansData, statsData] = await Promise.all([
          api.getScans(selectedTargetId || undefined),
          api.getStats(selectedTargetId || undefined),
        ]);
        setScans(scansData);
        setStats(statsData);

        if (activeScan) {
          const current = scansData.find((s) => s.id === activeScan.id);
          if (current) {
            setActiveScan(current);
            if (current.status === 'COMPLETED') {
              showToast('Reconnaissance Scan Complete', `Discovered ${current.assetsFound} assets and correlated ${current.findingsCount} findings.`, 'success');
              // Refresh all assets & findings
              const [assetsData, findingsData, graphRes, changesData] = await Promise.all([
                api.getAssets(selectedTargetId || undefined),
                api.getFindings({ targetId: selectedTargetId || undefined }),
                api.getGraph(selectedTargetId || undefined),
                api.getChanges(selectedTargetId || undefined),
              ]);
              setAssets(assetsData);
              setFindings(findingsData);
              setGraphData(graphRes);
              setChanges(changesData);
            }
          }
        }
      } catch (err) {
        // ignore polling network errors
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [scans, activeScan, selectedTargetId]);

  // Handlers
  const handleTargetAdded = (newTarget: Target, scan: Scan) => {
    setTargets((prev) => [newTarget, ...prev]);
    setSelectedTargetId(newTarget.id);
    setActiveScan(scan);
    showToast('Target Scope Authorized', `Initialized background reconnaissance pipeline for ${newTarget.domain}.`, 'success');
    loadData();
  };

  const handleScanStarted = (scan: Scan) => {
    setActiveScan(scan);
    setScans((prev) => [scan, ...prev]);
    showToast('Recon Job Dispatched', `Worker pipeline active for ${scan.targetDomain}`, 'info');
  };

  const handleDeleteTarget = async (id: string) => {
    try {
      await api.deleteTarget(id);
      setTargets((prev) => prev.filter((t) => t.id !== id));
      if (selectedTargetId === id) setSelectedTargetId('');
      showToast('Scope Deleted', 'Target assets and findings purged from inventory.', 'alert');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Could not delete target', 'alert');
    }
  };

  const handleUpdateFindingStatus = async (id: string, status: Finding['status']) => {
    try {
      const updated = await api.updateFindingStatus(id, status);
      setFindings((prev) => prev.map((f) => (f.id === id ? updated : f)));
      showToast('Finding Updated', `Status changed to ${status.replace(/_/g, ' ')}.`, 'info');
      // refresh stats and targets
      const [statsData, targetsData] = await Promise.all([
        api.getStats(selectedTargetId || undefined),
        api.getTargets(),
      ]);
      setStats(statsData);
      setTargets(targetsData);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update finding', 'alert');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      showToast('Environment Reset', 'Restored default Acme Corp demonstration dataset.', 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to reset demo dataset', 'alert');
    }
  };

  const handlePurgeAllTargets = async () => {
    try {
      await api.purgeAllTargets();
      setSelectedTargetId('');
      showToast('All Scopes Purged', 'All targets, demo websites, assets, scans, and vulnerabilities cleared.', 'alert');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to purge targets', 'alert');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleOpenStartScanModal = (target: Target) => {
    setScanModalTarget(target);
  };

  const handleInspectNode = (node: any) => {
    if (node.type === 'FINDING') {
      const matchFinding = findings.find(
        (f) => f.title.toLowerCase() === node.label.toLowerCase() || (node.metadata?.findingId && f.id === node.metadata.findingId)
      );
      if (matchFinding) {
        setSelectedFindingId(matchFinding.id);
      }
      setCurrentView('findings');
      showToast('Finding Selected', `Navigated to finding: ${node.label}`, 'info');
    } else {
      // Domain, Subdomain, IP, Service
      setAssetSearchQuery(node.label);
      setCurrentView('assets');
      showToast('Asset Selected', `Filtered inventory for: ${node.label}`, 'info');
    }
  };

  const handleLoginSuccess = (loggedInUser: User, token: string, redirect?: string) => {
    setUser(loggedInUser);
    localStorage.setItem('sentinelscope_token', token);
    if (redirect === 'admin-panel' || loggedInUser.role === 'ADMIN') {
      setCurrentView('admin-panel');
    } else {
      setCurrentView('dashboard');
    }
    showToast('Authenticated', `Session initialized for ${loggedInUser.name}.`, 'success');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(undefined);
    localStorage.removeItem('sentinelscope_token');
    showToast('Signed Out', 'Admin session securely terminated.', 'info');
  };

  const handleSendToRepeater = (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => {
    setRepeaterDraft(req);
    setCurrentView('repeater');
    showToast('Sent to Repeater', `${req.method} ${req.url}`, 'info');
  };

  const handleSendToIntruder = (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => {
    setIntruderDraft(req);
    setCurrentView('intruder');
    showToast('Sent to Intruder', `${req.method} ${req.url}`, 'info');
  };

  const openFindingsCount = findings.filter(
    (f) => f.severity === 'CRITICAL' && f.status !== 'RESOLVED'
  ).length;

  const activeScansCount = scans.filter((s) => s.status === 'RUNNING').length;

  // Initial token verification spinner
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-cyan-400 tracking-wider">VERIFYING SECURITY CREDENTIALS...</div>
        </div>
      </div>
    );
  }

  // Strict Admin Gate: Require valid admin authentication at Login Page before access
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 font-sans">
      {/* Top Navbar */}
      <Navbar
        targets={targets}
        selectedTargetId={selectedTargetId}
        onSelectTarget={setSelectedTargetId}
        onOpenAddTarget={() => setIsAddTargetModalOpen(true)}
        onResetDemo={handleResetDemo}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNavigate={setCurrentView}
        user={user}
        isScanningActive={activeScansCount > 0}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenMobileInstall={() => setIsMobileModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          openFindingsCount={openFindingsCount}
          activeScansCount={activeScansCount}
          userRole={user?.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 cyber-grid">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardPage
                stats={stats}
                activeScan={activeScan}
                targets={targets}
                selectedTargetId={selectedTargetId}
                onNavigate={setCurrentView}
                onOpenAddTarget={() => setIsAddTargetModalOpen(true)}
                onOpenStartScan={handleOpenStartScanModal}
                onSelectFinding={(id) => {
                  setSelectedFindingId(id);
                  setCurrentView('findings');
                }}
              />
            )}

            {currentView === 'targets' && (
              <TargetsPage
                targets={targets}
                onOpenAddTarget={() => setIsAddTargetModalOpen(true)}
                onOpenStartScan={handleOpenStartScanModal}
                onDeleteTarget={handleDeleteTarget}
                onSelectTarget={setSelectedTargetId}
                onNavigate={setCurrentView}
                onPurgeAll={handlePurgeAllTargets}
                onResetDemo={handleResetDemo}
              />
            )}

            {currentView === 'assets' && (
              <AssetsPage
                assets={assets}
                findings={findings}
                onSelectFinding={(id) => {
                  setSelectedFindingId(id);
                  setCurrentView('findings');
                }}
                onNavigate={setCurrentView}
                initialSearch={assetSearchQuery}
              />
            )}

            {currentView === 'endpoints' && (
              <EndpointsPage
                targets={targets}
                selectedTargetId={selectedTargetId}
                onSendToRepeater={handleSendToRepeater}
                onSendToIntruder={handleSendToIntruder}
              />
            )}

            {currentView === 'traffic' && (
              <TrafficPage
                targets={targets}
                selectedTargetId={selectedTargetId}
                onSendToRepeater={handleSendToRepeater}
                onSendToIntruder={handleSendToIntruder}
              />
            )}

            {currentView === 'repeater' && (
              <RepeaterPage
                targets={targets}
                selectedTargetId={selectedTargetId}
                assets={assets}
                initialRequest={repeaterDraft}
                onSendToIntruder={handleSendToIntruder}
              />
            )}

            {currentView === 'intruder' && (
              <IntruderPage
                targets={targets}
                selectedTargetId={selectedTargetId}
                assets={assets}
                initialRequest={intruderDraft}
                onSendToRepeater={handleSendToRepeater}
              />
            )}

            {currentView === 'crypto-stego' && (
              <CryptoStegoPage />
            )}

            {currentView === 'avi-terminal' && (
              <AviTerminalPage onNavigateToView={setCurrentView} />
            )}

            {currentView === 'findings' && (
              <FindingsPage
                findings={findings}
                onUpdateFindingStatus={handleUpdateFindingStatus}
                initialSelectedId={selectedFindingId}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'graph' && (
              <GraphPage
                graphData={graphData}
                onNavigate={setCurrentView}
                onInspectNode={handleInspectNode}
              />
            )}

            {currentView === 'scans' && (
              <ScansPage
                scans={scans}
                targets={targets}
                onOpenStartScan={handleOpenStartScanModal}
                onRerunScan={async (tId, type) => {
                  const s = await api.triggerScan(tId, type);
                  handleScanStarted(s);
                }}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'changes' && (
              <ChangesPage changes={changes} onNavigate={setCurrentView} />
            )}

            {currentView === 'reports' && (
              <ReportsPage
                targets={targets}
                selectedTargetId={selectedTargetId}
                assets={assets}
                findings={findings}
                scans={scans}
              />
            )}

            {currentView === 'education' && <EducationPage />}

            {currentView === 'admin-panel' && <AdminPanelPage currentUser={user} />}
          </div>
        </main>
      </div>

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={user}
        onLogout={handleLogout}
      />

      {/* Mobile PWA Install / Shortcut Modal */}
      <MobileInstallModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />

      {/* Add Target Modal with Scope Confirmation */}
      <AddTargetModal
        isOpen={isAddTargetModalOpen}
        onClose={() => setIsAddTargetModalOpen(false)}
        onTargetAdded={handleTargetAdded}
        currentUser={user}
      />

      {/* Start Scan Profile Modal */}
      {scanModalTarget && (
        <StartScanModal
          target={scanModalTarget}
          isOpen={!!scanModalTarget}
          onClose={() => setScanModalTarget(null)}
          onScanStarted={handleScanStarted}
        />
      )}

      {/* AVI Floating Assistant Terminal */}
      <AviFloatingTerminal
        isOpen={isAviFloatingOpen}
        onToggle={() => setIsAviFloatingOpen(!isAviFloatingOpen)}
        onOpenFullTerminal={() => {
          setIsAviFloatingOpen(false);
          setCurrentView('avi-terminal');
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-4 max-w-sm flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <div
            className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-400'
                : toastMessage.type === 'alert'
                ? 'bg-red-400'
                : 'bg-cyan-400'
            }`}
          />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-100">{toastMessage.title}</h4>
            {toastMessage.desc && <p className="text-[11px] text-slate-400">{toastMessage.desc}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
