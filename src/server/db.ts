// src/server/db.ts
// In-Memory Database Store & Query Engine for SentinelScope with initial Acme demo dataset

import fs from 'fs';
import path from 'path';
import {
  User,
  UserAuditLog,
  Target,
  Scan,
  Asset,
  Finding,
  HistoricalChange,
  Notification,
  DashboardStats,
  ScanEvent,
  AttackSurfaceGraphData,
  GraphNode,
  GraphLink,
  DiscoveredEndpoint,
  HttpTrafficItem,
  Role,
} from '../types';
import {
  DEMO_USER,
  DEMO_TARGETS,
  DEMO_ASSETS,
  DEMO_FINDINGS,
  DEMO_SCANS,
  DEMO_HISTORICAL_CHANGES,
  DEMO_NOTIFICATIONS,
} from '../data/demoData';
import { calculateRiskScore } from './scanner/riskScoring';
import { discoverEndpointsForDomain } from './scanner/endpointDiscovery';

export interface StoredUser extends User {
  passwordHash: string;
}

const AUDIT_LOG_FILE = path.join(process.cwd(), 'data', 'audit_logs.json');

class DatabaseStore {
  private users: Map<string, StoredUser> = new Map();
  private auditLogs: UserAuditLog[] = [];
  private targets: Map<string, Target> = new Map();
  private scans: Map<string, Scan> = new Map();
  private assets: Map<string, Asset> = new Map();
  private findings: Map<string, Finding> = new Map();
  private endpoints: Map<string, DiscoveredEndpoint> = new Map();
  private trafficLogs: HttpTrafficItem[] = [];
  private changes: HistoricalChange[] = [];
  private notifications: Notification[] = [];

  constructor() {
    this.loadAuditLogsFromDisk();
    this.seedDemoData();
  }

  private loadAuditLogsFromDisk() {
    try {
      if (fs.existsSync(AUDIT_LOG_FILE)) {
        const raw = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.auditLogs = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load audit logs from disk:', e);
    }
  }

  private saveAuditLogsToDisk() {
    try {
      const dir = path.dirname(AUDIT_LOG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist audit logs to disk:', e);
    }
  }

  public seedDemoData() {
    this.targets.clear();
    this.assets.clear();
    this.findings.clear();
    this.scans.clear();
    this.endpoints.clear();
    this.trafficLogs = [];
    this.changes = [];
    this.notifications = [];

    this.users.clear();

    // Preserve existing audit logs across demo reset
    if (this.auditLogs.length === 0) {
      this.loadAuditLogsFromDisk();
    }
    if (this.auditLogs.length === 0) {
      this.auditLogs = [
        {
          id: 'audit_init_1',
          userId: DEMO_USER.id,
          userName: 'lizki',
          userEmail: 'lizki.linux@gmail.com',
          ipAddress: '192.168.1.100',
          action: 'LOGIN_SUCCESS',
          status: 'SUCCESS',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
          details: 'Admin console access authorized',
        },
      ];
      this.saveAuditLogsToDisk();
    }

    // Admin user seeded with bcrypt hash of 'lizki123'
    this.users.set(DEMO_USER.id, {
      ...DEMO_USER,
      email: 'lizki.linux@gmail.com',
      name: 'lizki',
      passwordHash: '$2b$12$o/Pjry7eZva5L8ZUMNIpJuYVJ4cbU2GXMhOzuGaSd5uQyCRdY.rNO',
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    });

    for (const t of DEMO_TARGETS) {
      this.targets.set(t.id, { ...t });
    }

    for (const a of DEMO_ASSETS) {
      this.assets.set(a.id, { ...a });
    }

    for (const f of DEMO_FINDINGS) {
      this.findings.set(f.id, { ...f });
    }

    for (const s of DEMO_SCANS) {
      this.scans.set(s.id, { ...s, logs: [...s.logs] });
    }

    this.changes = [...DEMO_HISTORICAL_CHANGES];
    this.notifications = [...DEMO_NOTIFICATIONS];

    // Seed Endpoints for Demo Target
    const demoSubdomains = DEMO_ASSETS.map((a) => a.hostname);
    const initialEndpoints = discoverEndpointsForDomain('acme-demo.example', 'tgt_acme_corp', demoSubdomains);
    for (const ep of initialEndpoints) {
      this.endpoints.set(ep.id, ep);
    }

    // Seed Initial HTTP Proxy / Recon Traffic Logs
    const now = new Date();
    this.trafficLogs = [
      {
        id: 'req_init_1',
        targetId: 'tgt_acme_corp',
        timestamp: new Date(now.getTime() - 120000).toLocaleTimeString(),
        method: 'GET',
        url: 'https://api.acme-demo.example/v1/users?id=1042&role=admin',
        host: 'api.acme-demo.example',
        path: '/v1/users?id=1042&role=admin',
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 142,
        bodySize: 2048,
        requestHeaders: {
          'Host': 'api.acme-demo.example',
          'User-Agent': 'SentinelScope-ReconProbe/2.4',
          'Accept': 'application/json',
          'Authorization': 'Bearer sec_token_demo_984',
        },
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'x-powered-by': 'Express',
          'server': 'nginx/1.18.0',
        },
        responseBody: '{\n  "status": "success",\n  "user": {\n    "id": "1042",\n    "name": "Alex Jenkins",\n    "role": "admin",\n    "mfa_enabled": true\n  }\n}',
        source: 'RECON_PROBE',
      },
      {
        id: 'req_init_2',
        targetId: 'tgt_acme_corp',
        timestamp: new Date(now.getTime() - 95000).toLocaleTimeString(),
        method: 'GET',
        url: 'https://acme-demo.example/download?file=security_report_2026.pdf&format=pdf',
        host: 'acme-demo.example',
        path: '/download?file=security_report_2026.pdf&format=pdf',
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 310,
        bodySize: 81920,
        requestHeaders: {
          'Host': 'acme-demo.example',
          'User-Agent': 'SentinelScope-ReconProbe/2.4',
          'Accept': '*/*',
        },
        responseHeaders: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="security_report_2026.pdf"',
          'server': 'cloudflare',
        },
        responseBody: '[PDF Document Binary Stream - 81.9 KB]',
        source: 'ENDPOINT_DISCOVERY',
      },
      {
        id: 'req_init_3',
        targetId: 'tgt_acme_corp',
        timestamp: new Date(now.getTime() - 60000).toLocaleTimeString(),
        method: 'POST',
        url: 'https://api.acme-demo.example/api/v1/auth/token',
        host: 'api.acme-demo.example',
        path: '/api/v1/auth/token',
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 184,
        bodySize: 512,
        requestHeaders: {
          'Host': 'api.acme-demo.example',
          'Content-Type': 'application/json',
          'User-Agent': 'SentinelScope-ReconProbe/2.4',
        },
        requestBody: '{\n  "grant_type": "password",\n  "client_id": "sentinel_web_client",\n  "scope": "read:profile write:audit"\n}',
        responseHeaders: {
          'content-type': 'application/json',
          'strict-transport-security': 'max-age=31536000',
        },
        responseBody: '{\n  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}',
        source: 'RECON_PROBE',
      },
      {
        id: 'req_init_4',
        targetId: 'tgt_acme_corp',
        timestamp: new Date(now.getTime() - 30000).toLocaleTimeString(),
        method: 'GET',
        url: 'https://admin.acme-demo.example/admin/settings?tab=security&view_mode=extended',
        host: 'admin.acme-demo.example',
        path: '/admin/settings?tab=security&view_mode=extended',
        statusCode: 403,
        statusText: 'Forbidden',
        latencyMs: 88,
        bodySize: 340,
        requestHeaders: {
          'Host': 'admin.acme-demo.example',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        responseHeaders: {
          'content-type': 'text/html',
          'server': 'nginx/1.18.0',
        },
        responseBody: '<html><body><h1>403 Forbidden</h1><p>Access restricted to authorized enterprise subnet.</p></body></html>',
        source: 'RECON_PROBE',
      },
    ];
  }

  // Users & Identity Store
  public getUser(id: string): StoredUser | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): StoredUser | undefined {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return undefined;
  }

  public createUser(email: string, name: string, passwordHash: string, role: Role = 'ANALYST'): User {
    const normalized = email.trim().toLowerCase();
    const user: StoredUser = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email: normalized,
      name: name.trim(),
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public updateLastLogin(id: string): void {
    const u = this.users.get(id);
    if (u) {
      u.lastLoginAt = new Date().toISOString();
    }
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values()).map(({ passwordHash, ...safeUser }) => safeUser);
  }

  // Security Audit & Access Logs (Zero password disclosure - only tracks identity, IP, action, status)
  public logAuditEvent(entry: Omit<UserAuditLog, 'id' | 'timestamp'> & { timestamp?: string; targetDomain?: string }): UserAuditLog {
    const log: UserAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log); // newest first
    if (this.auditLogs.length > 5000) {
      this.auditLogs = this.auditLogs.slice(0, 5000);
    }
    this.saveAuditLogsToDisk();
    return log;
  }

  public getAuditLogs(limit?: number): UserAuditLog[] {
    if (limit && limit > 0) {
      return this.auditLogs.slice(0, limit);
    }
    return [...this.auditLogs];
  }

  public deleteAuditLog(id: string): boolean {
    const initialLen = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter((log) => log.id !== id);
    if (this.auditLogs.length < initialLen) {
      this.saveAuditLogsToDisk();
      return true;
    }
    return false;
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
    this.saveAuditLogsToDisk();
  }

  // Targets - User Scoped
  public getTargets(userId?: string): Target[] {
    let targets = Array.from(this.targets.values());
    if (userId) {
      targets = targets.filter((t) => t.userId === userId);
    }
    return targets.map((t) => {
      const targetAssets = this.getAssetsByTargetId(t.id);
      const targetFindings = this.getFindingsByTargetId(t.id);
      const liveHosts = targetAssets.filter((a) => a.status === 'LIVE').length;
      return {
        ...t,
        subdomainCount: targetAssets.length,
        liveHostCount: liveHosts,
        findingsCount: targetFindings.length,
      };
    });
  }

  public getTargetById(id: string): Target | undefined {
    const t = this.targets.get(id);
    if (!t) return undefined;
    const targetAssets = this.getAssetsByTargetId(t.id);
    const targetFindings = this.getFindingsByTargetId(t.id);
    return {
      ...t,
      subdomainCount: targetAssets.length,
      liveHostCount: targetAssets.filter((a) => a.status === 'LIVE').length,
      findingsCount: targetFindings.length,
    };
  }

  public getTargetByDomain(domain: string): Target | undefined {
    for (const t of this.targets.values()) {
      if (t.domain.toLowerCase() === domain.toLowerCase()) return t;
    }
    return undefined;
  }

  public addTarget(domain: string, authorizedBy: string, tags: string[] = [], notes?: string, userId?: string): Target {
    const id = `tgt_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const target: Target = {
      id,
      userId: userId || DEMO_USER.id,
      domain: domain.toLowerCase().trim(),
      name: `${domain} Primary Scope`,
      status: 'IDLE',
      riskScore: 0,
      riskLevel: 'LOW',
      isAuthorized: true,
      authorizedAt: now,
      authorizedBy,
      rateLimit: 60,
      tags: tags.length ? tags : ['Authorized Assessment'],
      notes,
      createdAt: now,
      updatedAt: now,
      subdomainCount: 0,
      liveHostCount: 0,
      findingsCount: 0,
    };
    this.targets.set(id, target);
    return target;
  }

  public updateTarget(id: string, updates: Partial<Target>): Target | undefined {
    const t = this.targets.get(id);
    if (!t) return undefined;
    const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
    this.targets.set(id, updated);
    return updated;
  }

  public deleteTarget(id: string): boolean {
    const target = this.targets.get(id);
    const domain = target ? target.domain.toLowerCase() : '';

    // Collect asset IDs to delete
    const assetIdsToDelete = new Set<string>();
    for (const [aId, asset] of this.assets.entries()) {
      if (
        asset.targetId === id ||
        (domain && (asset.hostname.toLowerCase() === domain || asset.hostname.toLowerCase().endsWith('.' + domain)))
      ) {
        assetIdsToDelete.add(aId);
        this.assets.delete(aId);
      }
    }

    // Delete associated findings
    for (const [fId, finding] of this.findings.entries()) {
      if (
        finding.targetId === id ||
        (finding.assetId && assetIdsToDelete.has(finding.assetId)) ||
        (domain && (finding.targetDomain?.toLowerCase() === domain || finding.assetHostname?.toLowerCase().endsWith(domain)))
      ) {
        this.findings.delete(fId);
      }
    }

    // Delete associated scans
    for (const [sId, scan] of this.scans.entries()) {
      if (scan.targetId === id || (domain && scan.targetDomain?.toLowerCase() === domain)) {
        this.scans.delete(sId);
      }
    }

    // Delete associated endpoints
    for (const [eId, ep] of this.endpoints.entries()) {
      if (ep.targetId === id || (domain && ep.hostname?.toLowerCase().includes(domain))) {
        this.endpoints.delete(eId);
      }
    }

    // Delete associated traffic logs
    this.trafficLogs = this.trafficLogs.filter(
      (log) => log.targetId !== id && (!domain || (!log.host?.toLowerCase().includes(domain) && !log.url?.toLowerCase().includes(domain)))
    );

    // Delete associated change history
    this.changes = this.changes.filter(
      (c) => c.targetId !== id && (!domain || c.targetDomain?.toLowerCase() !== domain)
    );

    // Delete associated notifications
    this.notifications = this.notifications.filter(
      (n) => !domain || (!n.title?.toLowerCase().includes(domain) && !n.message?.toLowerCase().includes(domain))
    );

    return this.targets.delete(id);
  }

  public purgeAllData(): boolean {
    this.targets.clear();
    this.assets.clear();
    this.findings.clear();
    this.scans.clear();
    this.endpoints.clear();
    this.trafficLogs = [];
    this.changes = [];
    this.notifications = [];
    return true;
  }

  // Assets
  public getAssets(): Asset[] {
    return Array.from(this.assets.values()).map((a) => ({
      ...a,
      findings: this.getFindingsByAssetId(a.id),
    }));
  }

  public getAssetById(id: string): Asset | undefined {
    const a = this.assets.get(id);
    if (!a) return undefined;
    return {
      ...a,
      findings: this.getFindingsByAssetId(a.id),
    };
  }

  public getAssetsByTargetId(targetId: string): Asset[] {
    return Array.from(this.assets.values())
      .filter((a) => a.targetId === targetId)
      .map((a) => ({
        ...a,
        findings: this.getFindingsByAssetId(a.id),
      }));
  }

  public upsertAsset(asset: Asset): Asset {
    this.assets.set(asset.id, asset);
    return asset;
  }

  // Findings
  public getFindings(): Finding[] {
    return Array.from(this.findings.values());
  }

  public getFindingById(id: string): Finding | undefined {
    return this.findings.get(id);
  }

  public getFindingsByTargetId(targetId: string): Finding[] {
    return Array.from(this.findings.values()).filter((f) => f.targetId === targetId);
  }

  public getFindingsByAssetId(assetId: string): Finding[] {
    return Array.from(this.findings.values()).filter((f) => f.assetId === assetId);
  }

  public updateFindingStatus(id: string, status: Finding['status']): Finding | undefined {
    const f = this.findings.get(id);
    if (!f) return undefined;
    const updated: Finding = {
      ...f,
      status,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    this.findings.set(id, updated);
    return updated;
  }

  public upsertFinding(finding: Finding): Finding {
    this.findings.set(finding.id, finding);
    return finding;
  }

  // Scans
  public getScans(): Scan[] {
    return Array.from(this.scans.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getScanById(id: string): Scan | undefined {
    return this.scans.get(id);
  }

  public getScansByTargetId(targetId: string): Scan[] {
    return Array.from(this.scans.values())
      .filter((s) => s.targetId === targetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createScan(targetId: string, scanType: Scan['scanType'] = 'FULL_RECON'): Scan {
    const target = this.targets.get(targetId);
    const id = `scn_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const scan: Scan = {
      id,
      targetId,
      targetDomain: target ? target.domain : 'unknown',
      userId: DEMO_USER.id,
      status: 'QUEUED',
      scanType,
      progress: 0,
      currentStage: 'Scan queued in worker backlog...',
      durationSeconds: 0,
      assetsFound: 0,
      findingsCount: 0,
      riskScoreDelta: 0,
      logs: [
        {
          id: `log_init_${Date.now()}`,
          scanId: id,
          stage: 'Queue',
          message: `Scan job dispatched for target domain: ${target?.domain}`,
          level: 'INFO',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.scans.set(id, scan);
    if (target) {
      this.updateTarget(target.id, { status: 'SCANNING' });
    }
    return scan;
  }

  public updateScan(id: string, updates: Partial<Scan>): Scan | undefined {
    const s = this.scans.get(id);
    if (!s) return undefined;
    const updated: Scan = {
      ...s,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scans.set(id, updated);
    return updated;
  }

  public addScanLog(scanId: string, stage: string, message: string, level: ScanEvent['level'] = 'INFO'): void {
    const s = this.scans.get(scanId);
    if (!s) return;
    const event: ScanEvent = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      scanId,
      stage,
      message,
      level,
      timestamp: new Date().toISOString(),
    };
    s.logs.push(event);
  }

  // Endpoints & Parameter Discovery
  public getEndpoints(targetId?: string): DiscoveredEndpoint[] {
    const list = Array.from(this.endpoints.values());
    if (targetId) {
      return list.filter((e) => e.targetId === targetId);
    }
    return list;
  }

  public getEndpointById(id: string): DiscoveredEndpoint | undefined {
    return this.endpoints.get(id);
  }

  public addEndpoint(ep: DiscoveredEndpoint): void {
    this.endpoints.set(ep.id, ep);
  }

  public setEndpointsForTarget(targetId: string, endpointsList: DiscoveredEndpoint[]): void {
    // Remove old endpoints for this target
    for (const [id, ep] of this.endpoints.entries()) {
      if (ep.targetId === targetId) {
        this.endpoints.delete(id);
      }
    }
    for (const ep of endpointsList) {
      this.endpoints.set(ep.id, ep);
    }
  }

  // HTTP Traffic Logs & Proxy History
  public getTrafficLogs(targetId?: string): HttpTrafficItem[] {
    if (targetId) {
      return this.trafficLogs.filter((t) => !t.targetId || t.targetId === targetId);
    }
    return this.trafficLogs;
  }

  public addTrafficLog(item: HttpTrafficItem): void {
    this.trafficLogs.unshift(item);
    // Keep max 200 items
    if (this.trafficLogs.length > 200) {
      this.trafficLogs = this.trafficLogs.slice(0, 200);
    }
  }

  public clearTrafficLogs(): void {
    this.trafficLogs = [];
  }

  // Changes & History
  public getChanges(targetId?: string): HistoricalChange[] {
    if (targetId) {
      return this.changes.filter((c) => c.targetId === targetId);
    }
    return this.changes;
  }

  public addChange(change: Omit<HistoricalChange, 'id' | 'timestamp'>): HistoricalChange {
    const fullChange: HistoricalChange = {
      ...change,
      id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.changes.unshift(fullChange);
    return fullChange;
  }

  // Notifications
  public getNotifications(): Notification[] {
    return this.notifications;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
  }

  public markAllNotificationsAsRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
  }

  public addNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const newN: Notification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newN);
    return newN;
  }

  // Stats for Main Dashboard
  public getDashboardStats(targetId?: string): DashboardStats {
    const allAssets = targetId ? this.getAssetsByTargetId(targetId) : this.getAssets();
    const allFindings = targetId ? this.getFindingsByTargetId(targetId) : this.getFindings();
    const allScans = targetId ? this.getScansByTargetId(targetId) : this.getScans();
    const allTargets = this.getTargets();

    const liveHosts = allAssets.filter((a) => a.status === 'LIVE').length;
    let openServicesCount = 0;
    const portMap = new Map<number, { service: string; count: number }>();
    const techMap = new Map<string, { count: number; category: string }>();

    for (const a of allAssets) {
      if (a.services) {
        for (const s of a.services) {
          if (s.state === 'OPEN') {
            openServicesCount++;
            const existing = portMap.get(s.port) || { service: s.name, count: 0 };
            existing.count++;
            portMap.set(s.port, existing);
          }
        }
      }
      if (a.technologies) {
        for (const t of a.technologies) {
          const existing = techMap.get(t.name) || { count: 0, category: t.category };
          existing.count++;
          techMap.set(t.name, existing);
        }
      }
    }

    const criticalFindings = allFindings.filter((f) => f.severity === 'CRITICAL' && f.status !== 'RESOLVED' && f.status !== 'FALSE_POSITIVE').length;
    const highFindings = allFindings.filter((f) => f.severity === 'HIGH' && f.status !== 'RESOLVED' && f.status !== 'FALSE_POSITIVE').length;
    const mediumFindings = allFindings.filter((f) => f.severity === 'MEDIUM' && f.status !== 'RESOLVED' && f.status !== 'FALSE_POSITIVE').length;
    const lowFindings = allFindings.filter((f) => f.severity === 'LOW' && f.status !== 'RESOLVED' && f.status !== 'FALSE_POSITIVE').length;
    const infoFindings = allFindings.filter((f) => f.severity === 'INFO' && f.status !== 'RESOLVED' && f.status !== 'FALSE_POSITIVE').length;

    const riskBreakdown = calculateRiskScore(allFindings, openServicesCount);

    const severityDistribution = [
      { severity: 'CRITICAL' as const, count: criticalFindings, color: '#ef4444' },
      { severity: 'HIGH' as const, count: highFindings, color: '#f97316' },
      { severity: 'MEDIUM' as const, count: mediumFindings, color: '#eab308' },
      { severity: 'LOW' as const, count: lowFindings, color: '#3b82f6' },
      { severity: 'INFO' as const, count: infoFindings, color: '#06b6d4' },
    ];

    const portDistribution = Array.from(portMap.entries())
      .map(([port, { service, count }]) => ({ port, service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const technologyDistribution = Array.from(techMap.entries())
      .map(([name, { count, category }]) => ({ name, count, category }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const assetsOverTime = [
      { date: 'Aug 10', totalAssets: 6, liveHosts: 5, findings: 10 },
      { date: 'Aug 14', totalAssets: 8, liveHosts: 6, findings: 14 },
      { date: 'Aug 18', totalAssets: 10, liveHosts: 7, findings: 18 },
      { date: 'Aug 22', totalAssets: 11, liveHosts: 8, findings: 22 },
      { date: 'Aug 26', totalAssets: allAssets.length, liveHosts, findings: allFindings.length },
    ];

    return {
      totalAssets: allAssets.length,
      liveHosts,
      openServices: openServicesCount,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      infoFindings,
      overallRiskScore: riskBreakdown.score,
      overallRiskLevel: riskBreakdown.level,
      lastScanTime: allScans[0]?.completedAt || allScans[0]?.createdAt,
      totalTargets: allTargets.length,
      severityDistribution,
      portDistribution,
      technologyDistribution,
      assetsOverTime,
      recentScans: allScans.slice(0, 5),
      recentFindings: allFindings.slice(0, 6),
      recentlyDiscoveredAssets: allAssets.slice(0, 6),
    };
  }

  // Attack Surface Graph Generator
  public getAttackSurfaceGraph(targetId?: string): AttackSurfaceGraphData {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set<string>();

    const targetList = targetId
      ? this.targets.get(targetId) ? [this.targets.get(targetId)!] : []
      : Array.from(this.targets.values());

    for (const target of targetList) {
      const rootNodeId = `node_${target.id}`;
      if (!nodeIds.has(rootNodeId)) {
        nodeIds.add(rootNodeId);
        nodes.push({
          id: rootNodeId,
          label: target.domain,
          type: 'DOMAIN',
          riskScore: target.riskScore,
          status: target.status,
          metadata: { targetId: target.id, isRoot: true },
        });
      }

      const targetAssets = this.getAssetsByTargetId(target.id);
      for (const asset of targetAssets) {
        const assetNodeId = `node_${asset.id}`;
        if (!nodeIds.has(assetNodeId)) {
          nodeIds.add(assetNodeId);
          nodes.push({
            id: assetNodeId,
            label: asset.hostname,
            type: asset.hostname === target.domain ? 'DOMAIN' : 'SUBDOMAIN',
            riskScore: asset.riskScore,
            status: asset.status,
            metadata: { assetId: asset.id, primaryIp: asset.primaryIp },
          });

          // Link from target domain to asset
          if (asset.hostname !== target.domain) {
            links.push({
              id: `link_${rootNodeId}_${assetNodeId}`,
              source: rootNodeId,
              target: assetNodeId,
              type: 'CONTAINS',
            });
          }
        }

        // IP Node
        if (asset.primaryIp) {
          const ipNodeId = `ip_${asset.primaryIp.replace(/\./g, '_')}`;
          if (!nodeIds.has(ipNodeId)) {
            nodeIds.add(ipNodeId);
            nodes.push({
              id: ipNodeId,
              label: asset.primaryIp,
              type: 'IP',
              metadata: { ip: asset.primaryIp },
            });
          }
          links.push({
            id: `link_${assetNodeId}_${ipNodeId}`,
            source: assetNodeId,
            target: ipNodeId,
            type: 'RESOLVES_TO',
          });
        }

        // Services Nodes
        if (asset.services) {
          for (const s of asset.services.slice(0, 3)) {
            const srvNodeId = `srv_${asset.id}_${s.port}`;
            if (!nodeIds.has(srvNodeId)) {
              nodeIds.add(srvNodeId);
              nodes.push({
                id: srvNodeId,
                label: `${s.port} ${s.name}`,
                type: 'SERVICE',
                metadata: { port: s.port, product: s.product },
              });
              links.push({
                id: `link_${assetNodeId}_${srvNodeId}`,
                source: assetNodeId,
                target: srvNodeId,
                type: 'EXPOSES',
                isHighRisk: s.port === 6379 || s.port === 3306,
              });
            }
          }
        }

        // Technology Nodes
        if (asset.technologies) {
          for (const t of asset.technologies.slice(0, 2)) {
            const techNodeId = `tech_${t.name.replace(/\s+/g, '_')}`;
            if (!nodeIds.has(techNodeId)) {
              nodeIds.add(techNodeId);
              nodes.push({
                id: techNodeId,
                label: t.name,
                type: 'TECH',
                metadata: { category: t.category, version: t.version },
              });
            }
            links.push({
              id: `link_${assetNodeId}_${techNodeId}`,
              source: assetNodeId,
              target: techNodeId,
              type: 'RUNS',
            });
          }
        }

        // Findings Nodes (Attach High & Critical Findings to Graph)
        const assetFindings = this.getFindingsByAssetId(asset.id);
        for (const f of assetFindings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
          const findingNodeId = `fnd_node_${f.id}`;
          if (!nodeIds.has(findingNodeId)) {
            nodeIds.add(findingNodeId);
            nodes.push({
              id: findingNodeId,
              label: f.title.length > 28 ? f.title.substring(0, 26) + '...' : f.title,
              type: 'FINDING',
              severity: f.severity,
              metadata: { findingId: f.id, fullTitle: f.title, cvss: f.cvssScore },
            });
            links.push({
              id: `link_${assetNodeId}_${findingNodeId}`,
              source: assetNodeId,
              target: findingNodeId,
              type: 'HAS_FINDING',
              isHighRisk: true,
            });
          }
        }
      }
    }

    return { nodes, links };
  }
}

export const db = new DatabaseStore();
